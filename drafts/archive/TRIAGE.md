# July drafts triage - 2026-08-19

Five day-stamped dailies (days 190-194, Jul 9-13) sat in drafts/ when the repo
went quiet. Triaged against the queue rule: publish-worthy queues behind the
finals edition, stale archives with reasons. The finals edition (Day 231: The
Final Six) published 2026-08-19, so the queue gate is open - but none of these
five can pass it.

Common reason: a "Year of the ZABAL - Day N" daily is dated by construction.
Days 190-194 are five-plus weeks past; publishing them now would carry wrong day
numbers and stale claims under Zaal's name. All five also still exist as
unpublished drafts on Paragraph (ids in automation/post-ids.json) - those are
left untouched; deleting drafts on Paragraph is Zaal's call only.

Per-file notes, and what was worth keeping:

| Draft | Verdict | Salvage |
|---|---|---|
| day-190 (auth fail-open + whisper loop fixes) | archive | the PR links live on in the repos' own history |
| day-191 (draft-pipe built, formats filled) | archive | the tooling it describes is documented in README + docs/amalgam-map.md |
| day-192 (boostr auto-like collab) | archive | the collab framing ("make the small thing easier for the next builder") is a voice-guide-worthy line, noted in docs/voice-guide.md standing calls if wanted |
| day-193 (Paragraph agents launch, headless read API proof) | archive | superseded by docs/mode-c-mcp-playbook.md + docs/case-study-day230.md, which carry the current platform knowledge |
| day-194 (dashboard walkthrough plan) | archive | the "suggestions inbox held a stale unverified draft" observation is exactly the fact gate; already encoded in the /newsletter skill |

Nothing here was deleted. Files moved to drafts/archive/ so drafts/ means
"queued to publish" again.
