import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  DEMO_PROFILE,
  PATIENT_ZERO_ATTRIBUTION,
  PATIENT_ZERO_DOMAINS,
  PATIENT_ZERO_FIXES,
  PATIENT_ZERO_PITCH_REPORT,
  PATIENT_ZERO_PROMPTS,
  PATIENT_ZERO_SNAPSHOTS,
} from '@verisource/core-geo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('1. Provisioning demo auth user (demo@verisource.dev)...');
  const { data: listRes, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  let demoUserId = DEMO_PROFILE.id;
  const existingUser = listRes.users.find(
    (u) => u.email?.toLowerCase() === DEMO_PROFILE.email.toLowerCase() || u.id === DEMO_PROFILE.id
  );

  if (existingUser) {
    demoUserId = existingUser.id;
    console.log(`   Existing demo auth user found: ${demoUserId}`);
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      id: DEMO_PROFILE.id,
      email: DEMO_PROFILE.email,
      email_confirm: true,
      user_metadata: { role: 'demo_agency' },
    });
    if (createErr) throw createErr;
    demoUserId = created.user.id;
    console.log(`   Created demo auth user: ${demoUserId}`);
  }

  console.log('2. Upserting demo profile...');
  const { error: profErr } = await supabase.from('profiles').upsert(
    {
      ...DEMO_PROFILE,
      id: demoUserId,
    },
    { onConflict: 'id' }
  );
  if (profErr) throw profErr;

  console.log('3. Upserting Patient Zero domains (aurearoasters.com & mosaicroasters.com)...');
  const domainsPayload = PATIENT_ZERO_DOMAINS.map((d) => ({
    ...d,
    user_id: demoUserId,
  }));
  const { error: domErr } = await supabase
    .from('domains')
    .upsert(domainsPayload, { onConflict: 'id' });
  if (domErr) throw domErr;

  console.log('4. Upserting tracked prompts...');
  const { error: promptErr } = await supabase
    .from('tracked_prompts')
    .upsert(PATIENT_ZERO_PROMPTS, { onConflict: 'id' });
  if (promptErr) throw promptErr;

  console.log('5. Upserting citation snapshots...');
  const { error: snapErr } = await supabase
    .from('citation_snapshots')
    .upsert(PATIENT_ZERO_SNAPSHOTS, { onConflict: 'id' });
  if (snapErr) throw snapErr;

  console.log('6. Upserting >=9.5/10 generated fixes...');
  const { error: fixErr } = await supabase
    .from('generated_fixes')
    .upsert(PATIENT_ZERO_FIXES, { onConflict: 'id' });
  if (fixErr) throw fixErr;

  console.log('7. Upserting AI attribution telemetry...');
  const { error: attrErr } = await supabase
    .from('ai_attribution_events')
    .upsert(PATIENT_ZERO_ATTRIBUTION, { onConflict: 'id' });
  if (attrErr) throw attrErr;

  console.log('8. Upserting agency white-label pitch report (mosaic-springfield-audit)...');
  const { error: pitchErr } = await supabase.from('agency_pitch_reports').upsert(
    {
      ...PATIENT_ZERO_PITCH_REPORT,
      agency_user_id: demoUserId,
    },
    { onConflict: 'share_slug' }
  );
  if (pitchErr) throw pitchErr;

  console.log('SUCCESS: Patient Zero seed suite is live in Supabase.');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
