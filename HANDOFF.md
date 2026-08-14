# HANDOFF.md

Written 16:20 PT, 2026-08-13. **Submissions close 5:00 PM PT — ~40 minutes.**

Read `CLAUDE.md`, `CONTEXT.md`, `SPEC.md` for the project. This file is the
current state only.

## Status: the demo works. Only the recording is left.

| # | Step | State |
|---|---|---|
| 1 | Seed Atlas | ✅ `node seed.js` |
| 2 | `server.js` | ✅ running on :3000 |
| 3 | `public/index.html` | ✅ written, all FRs working |
| 4 | 4 client tools in dashboard | ✅ added and **published**; verified firing |
| 5 | Rehearse + record 1-min video | ❌ **the only thing left** |

Submission checklist: repo public ✅ (https://github.com/VedantPimpley/accountabilitybot),
README ✅. Still unverified by the user: Atlas cluster is in the **hackathon
sandbox project**, and Network Access has `0.0.0.0/0`.

## What has been verified live

- **Alice interruption (FR3).** Add 2 tasks → count hits 4 → session autostarts
  with no button press. Agent opens referencing her history, asks for one
  concrete first step. Warm, unhurried.
- **Bob contrast.** Silence through 8 tasks. At 9 (over his threshold) it
  autostarts and is curt. Tone difference between the two is unmistakable.
- **Client tools.** `search_memories` fires on a blocker ("task feels too big to
  start"). `record_event` fires and writes to Atlas — 5 distinct rows confirmed
  in the `events` collection with `source: 'conversation'`.
- **No user name in behavioural logic.** Thresholds come from
  `working_model.threshold`. `grep "=== 'alice'"` returns nothing.

## What does NOT work / was cut

1. **`update_working_model` never fires.** The learning panel does not visibly
   grow (SPEC FR6, "proof of persistence"). This is cut-list item 3. Fixing it
   means a dashboard prompt nudge + Publish + retest, ~5 min. **Do not attempt
   before the video is recorded.**
2. **Bob at exactly 9 tasks autostarted but the agent said nothing** once. Off
   the demo path — the script never takes Bob past 6. Ignore it.
3. **The call never ends by itself.** The End Call system tool is not enabled in
   the dashboard. The user clicks End call manually. This is intentional; do not
   "fix" it today.

## The recording sequence

`node seed.js` before every take. Headphones on. Mute between turns.

1. Click **Alice** (also unlocks browser audio — mandatory, or the interruption
   plays silent)
2. Add 2 tasks → count hits 4 → agent interrupts on its own
3. Say: *"It's too big, I don't know where to start."*
4. Agent calls `search_memories`, cites the decomposition pattern, proposes a
   first step. Green tool log appears under the Talk button — leave it visible,
   it is the on-camera evidence.
5. Agree to the step → `record_event` fires
6. Click **End call**
7. Click **Bob** → add 2 tasks (takes him to 6) → **silence**. Let it sit.
8. Click **Talk to my coworker** → one blunt sentence saying nothing is wrong
9. Click **End call**
10. Say out loud:
    > "Neither rule was programmed."
    > "The agent's tone is a database field."

Counts: Alice is seeded with 2 open tasks and `threshold: 3` (fires at 4). Bob
is seeded with 4 and `threshold: 8` (silent at 6).

## Live-demo hazards, in order of likelihood

1. **Venue noise trips the agent's VAD** — it stops mid-sentence and rambles.
   There is now a **mute button** under Talk; hit it between your turns. Root
   cause is chatter around the user, not the code.
2. **Forgetting to click a user first.** Audio stays locked and the interruption
   is silent.
3. **Dashboard changes not taking effect.** Every ElevenLabs dashboard edit sits
   on a draft branch and needs **Publish**. This cost ~40 min today.

## Code notes for whoever picks this up

- `public/elevenlabs.js` is the vendored `@elevenlabs/client` 1.17.0 IIFE
  bundle, loaded as a classic script exposing `window.ElevenLabsClient`. Copying
  `dist/` wholesale does not work — `WebRTCConnection.js` bare-imports
  `livekit-client`.
- `USE_OVERRIDES` (line ~78) is `false`. Setting it `true` sends the system
  prompt from code via `overrides.agent.prompt.prompt` instead of the dashboard.
  **It requires enabling prompt overrides under Configure → Settings first** —
  sending an unpermitted override closes the WebSocket with
  `WebSocket is already in CLOSING or CLOSED state`. There is no Security tab in
  this dashboard layout.
- The system prompt currently in use is the dashboard one, reproduced in
  `CONTEXT.md`. `buildPrompt()` in the page is the unused code-side copy.
- `.env` holds `MONGODB_URI` and is gitignored. Verified not tracked.

## Uncommitted right now

`public/index.html` has changes not yet committed: the persistent green tool log,
`onUnhandledClientToolCall` logging, disconnect-reason logging, and the mute
button. All syntax-checked and serving. Commit after the video, not before.

## Next action

`node seed.js`, then record. Everything else is optional.
