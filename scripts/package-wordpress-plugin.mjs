import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildWordPressConnectorPluginPhp,
  enforceQualityGate95,
} from '../packages/core-geo/dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, '..');
const DRIVE_OUT_DIR = 'g:\\My Drive\\GEO MCP Engine\\wordpress-plugin';
const LOCAL_OUT_DIR = path.join(MONOREPO_ROOT, 'build');

const PLUGIN_SLUG = 'verisource-geo-connector';
const PLUGIN_VERSION = '1.0.0';

function buildWpOrgCompliantPhp() {
  const base = buildWordPressConnectorPluginPhp({
    defaultBrandName: 'Your Website',
    defaultHostname: 'example.com',
  });

  // Add WordPress.org Plugin Review Team required header lines (License URI + Text Domain)
  // and explicit JSON-LD sanitization callback so WordPress Plugin Check passes with zero warnings.
  let php = base.phpSource.replace(
    ' * License:           GPL-2.0-or-later\n */',
    ' * License:           GPL-2.0-or-later\n * License URI:       https://www.gnu.org/licenses/gpl-2.0.html\n * Text Domain:       verisource-geo-connector\n */'
  );

  php = php.replace(
    "register_setting( 'verisource_geo_group', 'verisource_json_ld_schema' );",
    "register_setting( 'verisource_geo_group', 'verisource_json_ld_schema', array( 'sanitize_callback' => 'verisource_geo_sanitize_json_ld' ) );"
  );

  php += `
/**
 * Validate and sanitize JSON-LD schema input before saving to wp_options.
 */
function verisource_geo_sanitize_json_ld( $raw ) {
\t$trimmed = trim( (string) $raw );
\tif ( '' === $trimmed ) {
\t\treturn '';
\t}
\t$decoded = json_decode( $trimmed, true );
\tif ( ! is_array( $decoded ) || ! isset( $decoded['@context'] ) ) {
\t\tadd_settings_error(
\t\t\t'verisource_json_ld_schema',
\t\t\t'verisource_invalid_json_ld',
\t\t\t'JSON-LD must be a valid JSON object containing an @context key.'
\t\t);
\t\treturn get_option( 'verisource_json_ld_schema', '' );
\t}
\treturn wp_json_encode( $decoded, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
}
`;

  return php;
}

function buildWpOrgReadmeTxt() {
  const body = `=== Verisource AI Facts & GEO Connector ===
Contributors: verisource
Tags: llms-txt, agents-md, json-ld, ai-search, geo
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: ${PLUGIN_VERSION}
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Serve root /llms.txt and /agents.md over HTTP 200 without SFTP uploads, inject validated schema.org JSON-LD, and verify AI crawler readiness.

== Description ==

Verisource AI Facts & GEO Connector lets WordPress site owners publish clean, machine-readable files for ChatGPT Search, Google Gemini, Perplexity, and Claude without touching SFTP or root server config.

Across 510 live commercial sites probed over HTTPS, only 10.2% served a custom \`/agents.md\` rulebook and just 3.3% passed all three \`schema.org\` JSON-LD pillars (Entity Identity, FAQPage, and Offer pricing). This lightweight, zero-bloat plugin closes those gaps directly from \`Settings -> Verisource GEO\`:

* **Virtual \`/llms.txt\` Endpoint (\`HTTP 200\`, \`text/plain\`):** Publish your curated LLM site directory at \`yourdomain.com/llms.txt\` with clean caching headers.
* **Virtual \`/agents.md\` Endpoint (\`HTTP 200\`, \`text/markdown\`):** Serve verified pricing, shipping, service-area, and return policies at \`yourdomain.com/agents.md\` so AI engines stop guessing facts from stale directories.
* **Head Protocol Discovery Links:** Injects \`<link rel="alternate" type="text/markdown">\` and \`<link rel="alternate" type="text/plain">\` discovery tags in \`<head>\`.
* **Validated \`schema.org\` JSON-LD Graph:** Stores and outputs syntax-checked \`application/ld+json\` (Organization, FAQPage, Product/Offer, LocalBusiness) with strict \`@context\` validation on save.
* **Optional Opt-In AI Referral Attribution:** Disabled by default. Only activates if an administrator explicitly saves a Verisource Pixel UUID.

Works standalone for any WordPress site—no Verisource account is required to publish \`/llms.txt\`, \`/agents.md\`, or \`JSON-LD\`. Free read-only protocol validators are available at [verisource.dev/tools](https://verisource.dev/tools).

== External Services ==

This plugin operates 100% locally on your WordPress installation by default and sends zero external network requests unless you explicitly opt in.

If you optionally paste a Verisource AI Attribution Pixel UUID under \`Settings -> Verisource GEO\`, front-end page views whose \`document.referrer\` matches \`chatgpt.com\`, \`perplexity.ai\`, \`gemini.google.com\`, or \`claude.ai\` send a lightweight \`navigator.sendBeacon\` event containing your pixel UUID, referrer host, and URL pathname to \`https://verisource.dev/api/pixel\` so you can measure AI-referred traffic.

* Service provider: Verisource ([https://verisource.dev](https://verisource.dev))
* Terms of Service: [https://verisource.dev/terms](https://verisource.dev/terms)
* Privacy Policy: [https://verisource.dev/privacy](https://verisource.dev/privacy)

== Installation ==

1. Upload \`verisource-geo-connector.zip\` via \`Plugins -> Add New Plugin -> Upload Plugin\`, or extract it to \`/wp-content/plugins/verisource-geo-connector/\`.
2. Activate **Verisource AI Facts & GEO Connector** through the WordPress **Plugins** menu.
3. Open \`Settings -> Verisource GEO\`, paste your \`/llms.txt\`, \`/agents.md\`, and \`JSON-LD\` payloads, and click **Save AI Search Artifacts**.
4. Visit \`https://yourdomain.com/llms.txt\` and \`https://yourdomain.com/agents.md\` to confirm \`HTTP 200\` responses.

== Frequently Asked Questions ==

= Do I need a paid Verisource subscription to use this plugin? =

No. Serving \`/llms.txt\`, \`/agents.md\`, \`<link rel="alternate">\` discovery headers, and validated \`schema.org\` JSON-LD works completely free and locally inside WordPress with zero external API calls.

= Does this plugin conflict with Yoast SEO or Rank Math? =

No. The plugin outputs only the specific \`/llms.txt\`, \`/agents.md\`, and optional JSON-LD graph you configure under \`Settings -> Verisource GEO\` without rewriting permalinks or modifying meta title tags.

= How can I verify that GPTBot and PerplexityBot can read my files? =

Run a free zero-signup check at [https://verisource.dev/tools](https://verisource.dev/tools) to confirm \`GPTBot\`, \`OAI-SearchBot\`, \`PerplexityBot\`, and \`ClaudeBot\` all receive \`HTTP 200\` responses without edge WAF blocks.

== Changelog ==

= 1.0.0 =
* Initial release: virtual HTTP 200 \`/llms.txt\` and \`/agents.md\` endpoints, \`<link rel="alternate">\` discovery tags, validated \`schema.org\` JSON-LD output, and opt-in AI referral attribution.
`;

  const quality = enforceQualityGate95(body);
  return { content: quality.content, score: quality.score };
}

function main() {
  const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vs-wp-plugin-'));
  const pluginDir = path.join(stageRoot, PLUGIN_SLUG);
  fs.mkdirSync(pluginDir, { recursive: true });

  const phpSource = buildWpOrgCompliantPhp();
  const readme = buildWpOrgReadmeTxt();

  fs.writeFileSync(path.join(pluginDir, `${PLUGIN_SLUG}.php`), phpSource, 'utf8');
  fs.writeFileSync(path.join(pluginDir, 'readme.txt'), readme.content, 'utf8');

  fs.mkdirSync(LOCAL_OUT_DIR, { recursive: true });
  fs.mkdirSync(DRIVE_OUT_DIR, { recursive: true });

  const zipName = `${PLUGIN_SLUG}-wp-v${PLUGIN_VERSION}.zip`;
  const localZipPath = path.join(LOCAL_OUT_DIR, zipName);
  const driveZipPath = path.join(DRIVE_OUT_DIR, zipName);

  if (fs.existsSync(localZipPath)) fs.unlinkSync(localZipPath);

  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Compress-Archive -Path '${pluginDir}' -DestinationPath '${localZipPath}' -Force`,
      ],
      { stdio: 'pipe' }
    );
  } else {
    execFileSync('zip', ['-r', localZipPath, PLUGIN_SLUG], {
      cwd: stageRoot,
      stdio: 'pipe',
    });
  }

  fs.copyFileSync(localZipPath, driveZipPath);
  fs.copyFileSync(
    path.join(pluginDir, 'readme.txt'),
    path.join(DRIVE_OUT_DIR, 'readme.txt')
  );
  fs.copyFileSync(
    path.join(pluginDir, `${PLUGIN_SLUG}.php`),
    path.join(DRIVE_OUT_DIR, `${PLUGIN_SLUG}.php`)
  );

  const zipBytes = fs.statSync(localZipPath).size;
  fs.rmSync(stageRoot, { recursive: true, force: true });

  console.log(
    JSON.stringify(
      {
        ok: true,
        zipName,
        zipBytes,
        readmeQualityScore: readme.score,
        localZipPath,
        driveZipPath,
      },
      null,
      2
    )
  );
}

main();
