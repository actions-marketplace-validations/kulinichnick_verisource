# Antigravity Dynamic Multi-Agent Workflow: Autonomous Organic Acquisition Engine
# Invoke via Antigravity `run_workflow` tool:
#   run_workflow(ScriptPath="C:/dev/verisource/scripts/growth_workflows/organic_acquisition_workflow.py", Description="Run Community Scout, 25% Partner Scout, GSC SEO Heal & YouTube Shorts Factory in parallel")

phase("1. Parallel Organic Acquisition Sweep (Community · Partners · YouTube Shorts)")

community_prompt = """Execute the `community-citation-scout` sweep:
1. Run `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-community-scout.mjs --limit 8` (append `--send-email` when sending the morning founder digest).
2. Read `g:\\My Drive\\GEO MCP Engine\\growth_ops\\queue\\COMMUNITY_SIGNAL_DIGEST.md` and confirm every drafted reply has clear founder disclosure, concrete HTTP or N=510 evidence, and `>= 9.5/10.0` quality with zero banned AI lexicon words.
Return the top 3 thread URLs and intent scores."""

partner_prompt = """Execute the `partner-affiliate-scout` sweep:
1. Run `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-partner-scout.mjs --batch 4` and `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-gsc-heal.mjs --ping-indexnow`.
2. Verify `g:\\My Drive\\GEO MCP Engine\\growth_ops\\queue\\PARTNER_CREATOR_OUTREACH.md` enforces Zero-Bounce MX + on-site mailbox checks (routing unverified domains to `social_dm_only`) and includes valid `https://verisource.dev/r/[slug]` partner links.
Return verified partner count, Bing IndexNow submission status, and top GSC striking-distance or teardown targets."""

video_prompt = """Execute the `youtube-teardown-factory` sweep:
1. Run `node C:\\dev\\verisource\\scripts\\growth_workflows\\ops-video-factory.mjs --count 2`.
2. Read `g:\\My Drive\\GEO MCP Engine\\growth_ops\\queue\\VIDEO_FACTORY_QUEUE.md` and confirm the 1080x1920 H.264 `.mp4` Shorts, `.srt` captions, and `>= 9.5/10.0` YouTube SEO descriptions rendered cleanly.
Return the rendered brand domains, MP4 paths, and YouTube titles."""

community_res, partner_res, video_res = await parallel(
    [
        ("Community Citation Scout", "community-citation-scout", "inherit", community_prompt),
        ("Partner Affiliate Scout", "partner-affiliate-scout", "inherit", partner_prompt),
        ("YouTube Teardown Factory", "youtube-teardown-factory", "inherit", video_prompt),
    ],
    lambda item: agent(
        item[3],
        schema={"type": "string"},
        role=item[0],
        type_name=item[1],
        model=item[2],
    ),
)

phase("2. Founder Handover Summary")
log("Community Signal Digest:", community_res)
log("Partner & GSC SEO Summary:", partner_res)
log("YouTube Shorts Video Factory:", video_res)
print("Autonomous Organic Acquisition sweep complete. Review COMMUNITY_SIGNAL_DIGEST.md, PARTNER_CREATOR_OUTREACH.md, GSC_SEO_HEALING_PLAN.md, and VIDEO_FACTORY_QUEUE.md.")
