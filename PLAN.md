# PLAN.md — handoff

## Where we are

Steps 1–2 done. Step 3 written but failing on first load. Steps 4–5 untouched.

| # | Step | State |
|---|---|---|
| 1 | Seed Atlas | ✅ `node seed.js` passes. Alice 90 events / threshold 3; Bob 90 / threshold 8 |
| 2 | `server.js` | ✅ Connects to Atlas, 7 routes, serves `./public` |
| 3 | `public/index.html` | ⚠️ Written. **Blocked — see below** |
| 4 | 4 client tools in ElevenLabs dashboard | ❌ Not started (~5 min) |
| 5 | Rehearse + record 1-min video | ❌ Not started (~8 min) |

Dashboard state: agent created, system prompt set, "agent speaks first" ON with
no fixed first message, all five dynamic variables created **with defaults**.
Tools section is still empty.

## BLOCKER — fix this first

```
Uncaught ReferenceError: selectUser is not defined
```

Cause: the ESM import at the top of the inline `<script type="module">` fails,
so the module body never executes and no `window.*` handler is ever assigned.
The `ReferenceError` is the symptom; the import failure is above it in the
console.

Suspect: the pinned version `https://esm.sh/@elevenlabs/client@0.1.4` does not
resolve.

Fix, in order of preference:

1. Drop the pin: `import { Conversation } from 'https://esm.sh/@elevenlabs/client';`
2. If esm.sh is slow or blocked (likely on venue wifi), vendor it locally —
   more reliable for the live demo regardless:
   ```bash
   npm i @elevenlabs/client
   cp -r node_modules/@elevenlabs/client/dist public/elevenlabs
   ```
   then import from `./elevenlabs/lib/esm/index.js` (verify the actual path in
   the package — do not assume it).
3. Check the current SDK's exported symbol and `startSession` signature before
   assuming the call shape in `index.html` is correct. Verify
   `connectionType: 'websocket'`, `dynamicVariables`, and `clientTools` are the
   current parameter names.

Isolate before proceeding: click Alice, click Talk. **If the agent speaks at
all**, the SDK path is good and any remaining weirdness is missing tools
(step 4), not connection.

## Step 4 — client tools (~5 min, dashboard, no code)

> **Hit Publish after every dashboard change.** The agent editor works on a
> draft branch (`?branchId=agtbrch_...`). Nothing you change there — prompt,
> first message, tools — reaches a live session until you click **Publish**
> (top right). This cost ~40 min on the system prompt already.

Tools → Add Tool → Type: **Client**, for each of the four. Paste these
descriptions verbatim; the LLM selects tools off them and vague ones are why
`search_memories` gets skipped mid-demo.

**`search_memories`** — *Search this user's stored behavioural history for
patterns relevant to their current situation. Call this BEFORE giving any advice
about a blocker, an overload, or how to plan their day. Returns past events and
what actually worked or failed for this specific person.*
- `query` (string, required): *The situation or problem to look up, in plain
  words. Use the user's own phrasing where possible. Examples: "task feels too
  big to start", "five open tasks", "blocked on the same item twice". Do not
  pass the user's name — the search is already scoped to them.*

**`get_tasks`** — *Get the user's current open tasks with their status. Call
this at the start of a conversation about workload, or whenever the user refers
to "my tasks", "today", or "what's left".* No parameters.

**`record_event`** — *Log what just happened in this conversation so it becomes
part of the user's history. Call this when the user commits to a plan, agrees to
drop or defer a task, reports being blocked, or pushes back on your suggestion.
This is how the system learns — do not skip it.*
- `event_type` (string, required): *One of exactly these values: `committed`,
  `deferred`, `blocked`, `completed`, `rejected_suggestion`,
  `accepted_intervention`. Pick the closest match. Do not invent new values.*
- `detail` (string, required): *One sentence describing what happened, in the
  third person, specific enough to be useful months later. Include the numbers.
  Good: "Agreed to cut from five tasks to the two client deliverables."*

**`update_working_model`** — *Save a new durable insight about how this person
works. Call this only when you have learned something that will still be true
next week — a pattern, a threshold, a preference — not a one-off detail about
today's tasks.*
- `insight` (string, required): *One sentence in the form "trigger → outcome"
  describing a repeatable pattern. Never include today's specific task names.*

## Step 5 — rehearse and record (~8 min)

Two full runs of the demo script in SPEC.md. Record take two.
`node seed.js` for a clean slate between takes.

## Submission checklist (hard deadline 5:00 PM PT)

- [ ] Repo is **public**
- [ ] 1-minute demo video uploaded, link accessible
- [ ] All team members added to the submission page
- [ ] Build lives in the **Atlas hackathon sandbox** project (required for the
      finalist round — verify the project name in the Atlas switcher matches the
      one provisioned by the sandbox email, not a personal org)
- [ ] README states clearly what was built during the event

## Before leaving for the venue

- Atlas → Network Access → add `0.0.0.0/0`. Conference wifi changes your IP and
  a pinned IP will kill the demo on stage.
- Rotate the Atlas password if it was ever pasted into a chat log.
- Consider vendoring the ElevenLabs SDK locally rather than relying on a CDN.

## Two lines to say out loud in the demo

> "Neither rule was programmed."
> "The agent's tone is a database field."
