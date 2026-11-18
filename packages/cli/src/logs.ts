import {
  loadLocalProviderConfig,
  type StoredHandleItem,
} from './store.js';

export type LogProviderId = 'vercel' | 'supabase' | 'cloudflare';

export interface CorrelatedLogEvent {
  handle: string;
  provider: LogProviderId;
  timestamp: string;
  level: 'error' | 'warn';
  message: string;
  routeOrScript?: string;
}

export async function queryCorrelatedBackendLogs(params: {
  providers?: LogProviderId[];
  windowStartMs: number;
  windowEndMs: number;
  cwd?: string;
}): Promise<CorrelatedLogEvent[]> {
  const cfg = loadLocalProviderConfig(params.cwd);
  const activeProviders: LogProviderId[] = params.providers ?? [
    'vercel',
    'supabase',
    'cloudflare',
  ];

  const sinceMs = Math.max(0, params.windowStartMs - 1000);
  const untilMs = params.windowEndMs + 2000;
  const collected: CorrelatedLogEvent[] = [];
  let counter = 0;

  for (const provider of activeProviders) {
    if (provider === 'vercel' && cfg.vercel?.token && cfg.vercel.projectId) {
      try {
        const qs = new URLSearchParams({
          projectId: cfg.vercel.projectId,
          since: String(sinceMs),
          until: String(untilMs),
          limit: '25',
        });
        if (cfg.vercel.teamId) qs.set('teamId', cfg.vercel.teamId);

        const res = await fetch(
          `https://api.vercel.com/v3/events?${qs.toString()}`,
          {
            headers: { Authorization: `Bearer ${cfg.vercel.token}` },
          }
        );
        if (res.ok) {
          const json = (await res.json()) as {
            events?: Array<{
              created?: number;
              text?: string;
              type?: string;
              payload?: { statusCode?: number; path?: string; message?: string };
            }>;
          };
          for (const ev of json.events ?? []) {
            const status = ev.payload?.statusCode ?? 200;
            const text = ev.payload?.message ?? ev.text ?? '';
            if (status >= 400 || /error|exception|fail/i.test(text)) {
              counter += 1;
              collected.push({
                handle: `g${counter}`,
                provider: 'vercel',
                timestamp: new Date(ev.created ?? Date.now()).toISOString(),
                level: status >= 500 ? 'error' : 'warn',
                message: text.slice(0, 260) || `HTTP ${status} runtime event`,
                routeOrScript: ev.payload?.path,
              });
            }
          }
        }
      } catch {
        // Non-fatal provider timeout
      }
    }

    if (
      provider === 'supabase' &&
      cfg.supabase?.accessToken &&
      cfg.supabase.projectRef
    ) {
      try {
        const qs = new URLSearchParams({
          iso_timestamp_start: new Date(sinceMs).toISOString(),
          iso_timestamp_end: new Date(untilMs).toISOString(),
        });
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${encodeURIComponent(
            cfg.supabase.projectRef
          )}/analytics/endpoints/logs.all?${qs.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${cfg.supabase.accessToken}`,
            },
          }
        );
        if (res.ok) {
          const json = (await res.json()) as {
            result?: Array<{
              timestamp?: number;
              event_message?: string;
              metadata?: unknown;
            }>;
          };
          for (const row of json.result ?? []) {
            const msg = row.event_message ?? '';
            if (/error|fatal|panic|violates|denied|422|500/i.test(msg)) {
              counter += 1;
              collected.push({
                handle: `g${counter}`,
                provider: 'supabase',
                timestamp: row.timestamp
                  ? new Date(Math.round(row.timestamp / 1000)).toISOString()
                  : new Date().toISOString(),
                level: 'error',
                message: msg.slice(0, 260),
              });
            }
          }
        }
      } catch {
        // Non-fatal provider timeout
      }
    }

    if (
      provider === 'cloudflare' &&
      cfg.cloudflare?.apiToken &&
      cfg.cloudflare.accountId
    ) {
      try {
        const query = `
          query WorkerErrors($accountTag: string!, $since: Time!, $until: Time!) {
            viewer {
              accounts(filter: { accountTag: $accountTag }) {
                workersInvocationsAdaptive(
                  limit: 20
                  filter: { datetime_geq: $since, datetime_leq: $until, status_neq: "ok" }
                ) {
                  dimensions {
                    scriptName
                    status
                    datetime
                  }
                }
              }
            }
          }
        `;
        const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.cloudflare.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              accountTag: cfg.cloudflare.accountId,
              since: new Date(sinceMs).toISOString(),
              until: new Date(untilMs).toISOString(),
            },
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data?: {
              viewer?: {
                accounts?: Array<{
                  workersInvocationsAdaptive?: Array<{
                    dimensions?: {
                      scriptName?: string;
                      status?: string;
                      datetime?: string;
                    };
                  }>;
                }>;
              };
            };
          };
          const invocations =
            json.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? [];
          for (const inv of invocations) {
            const dim = inv.dimensions;
            if (!dim) continue;
            if (
              cfg.cloudflare.scriptName &&
              dim.scriptName !== cfg.cloudflare.scriptName
            ) {
              continue;
            }
            counter += 1;
            collected.push({
              handle: `g${counter}`,
              provider: 'cloudflare',
              timestamp: dim.datetime ?? new Date().toISOString(),
              level: 'error',
              message: `Worker ${dim.scriptName ?? 'script'} exited with status "${dim.status ?? 'exception'}"`,
              routeOrScript: dim.scriptName,
            });
          }
        }
      } catch {
        // Non-fatal provider timeout
      }
    }
  }

  return collected;
}

export function logEventsToStoredHandles(
  events: CorrelatedLogEvent[]
): StoredHandleItem[] {
  return events.map((ev) => ({
    handle: ev.handle,
    kind: 'backend_log',
    severity: ev.level === 'error' ? 'critical' : 'warn',
    summary: `[${ev.provider}] ${ev.message}`,
    url: ev.routeOrScript,
    detail: {
      provider: ev.provider,
      timestamp: ev.timestamp,
      level: ev.level,
      routeOrScript: ev.routeOrScript ?? null,
    },
    fixHint:
      'Inspect server handler stacktrace in the correlated run timestamp window.',
  }));
}
