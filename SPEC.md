# SPEC.md

## Core loop

`Task → Observe → Learn → Intervene → Outcome → Learn again`

## Functional requirements

### FR1 — User switching
Alice/Bob toggle. Switching ends any live call, resets `hasIntervened`, and
reloads all state from Atlas. No login.

### FR2 — Task surface
List of open tasks. Add via text input. Per-task `Complete` / `Blocked`.
Live open-task count, styled red when above the user's stored threshold.

### FR3 — The intervention (the demo's centrepiece)
On task add, compare open count to `state.threshold` (from MongoDB).
If above, and not already intervened this session, auto-start the voice session
with `trigger_reason` describing the breach.

Guards, both required:
- `hasIntervened` — fires at most once per user session. An agent that
  interrupts twice reads as broken, not attentive.
- Manual `Talk to my coworker` button always remains, as the live-demo fallback
  if autostart misfires on stage.

**No user name may appear in this logic.** Alice fires at 4, Bob at 9, from data.

### FR4 — Voice conversation
`@elevenlabs/client`, `connectionType: 'websocket'`, public agent (no token).
All five dynamic variables passed at `startSession`.

### FR5 — Client tools
Registered in `startSession({ clientTools })`. Names must match the dashboard
exactly (case-sensitive).

| Tool | Params | Behaviour |
|---|---|---|
| `get_tasks` | — | Returns open task titles from local state |
| `search_memories` | `query` | `GET /api/memories/:user?q=` |
| `record_event` | `event_type`, `detail` | `POST /api/event` |
| `update_working_model` | `insight` | `POST /api/insight`, then repaint panel |

`event_type` is constrained to: `committed`, `deferred`, `blocked`, `completed`,
`rejected_suggestion`, `accepted_intervention`.

### FR6 — Learning panel
"What I've learned about you" renders `working_model.summary`. When
`update_working_model` fires, the new insight appends in accent colour.
This must be visible on camera — it is the proof of persistence.

## Demo script (target: 60 seconds)

1. Click **Alice**. Panel shows what the system knows about her.
2. Add tasks until the count hits 4.
3. Agent interrupts unprompted: *"Four is past where you usually hold. Last time
   you had five open you finished two…"* — warm, unhurried, asks for one step.
4. Reply: *"It's too big, I don't know where to start."*
5. Agent calls `search_memories`, cites the decomposition pattern, proposes the
   first concrete step. Calls `record_event`.
6. Panel visibly gains a new learned line.
7. Click **Bob**. Add tasks to 5 or 6. **Silence.** Click Talk manually — agent
   is blunt, one sentence, says nothing is wrong.
8. Closing line, said out loud:
   > *"Neither rule was programmed. The agent's tone is a database field."*

## Non-goals

Anything in CONTEXT.md § "Explicitly out of scope".

## Cut list, in this order, if the clock bites

1. `search_memories` (agent reasons from `working_model` alone)
2. Bob's live half — narrate it over a screenshot instead
3. Live learning-panel update
4. All styling
