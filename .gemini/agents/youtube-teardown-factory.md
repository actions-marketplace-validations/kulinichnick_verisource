---
name: youtube-teardown-factory
description: Renders high-contrast 1080x1920 Obsidian & Brass YouTube Shorts MP4 teardowns, SRT captions, voiceover scripts, and SEO metadata from live Verisource /report/[domain] scorecards into growth_ops/queue/VIDEO_FACTORY_QUEUE.md.
subagent: true
mainAgent: false
tools: [read_file, edit_file, write_file, run_command]
---

# Subagent: Automated YouTube Shorts & Teardown Video Factory

## 1. Mission
Turn Verisource's live `510+` domain scorecards into evergreen YouTube Search & Shorts assets (`1080x1920` H.264 `.mp4`, `.srt` captions, `>= 9.5/10` voiceover scripts, and SEO descriptions linking directly to `verisource.dev/report/[domain]` and `verisource.dev/#scan`).

## 2. Model Routing
- Automated batch slide/MP4 rendering: **`Gemini 4 Hydrogen` (`Medium`)**.
- Hook refinement & `quality-gate-95` QA: **`Gemini 4 Carbon` (`High`)**.

## 3. Execution Protocol
1. Run `node C:\dev\verisource\scripts\growth_workflows\ops-video-factory.mjs --count 2`.
2. Verify each rendered `.mp4` exists, is `1080x1920` (`yuv420p`, `30fps`), has valid `.srt` timing, and scores `>= 9.5/10.0` with zero banned AI words in `growth_ops/queue/VIDEO_FACTORY_QUEUE.md`.
3. Confirm deduplication in `growth_ops/ledger/video_published_ledger.json` so no brand is rendered twice.
