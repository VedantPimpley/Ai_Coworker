# CONTEXT.md

## The one-sentence pitch

> It doesn't tell you how to work. It learns how you work.

## Why this wins the ElevenLabs prize

Judged on: Agentic Depth, Interaction Design, Technical Integration, Novelty.
Three design decisions map to those, and must survive any refactor:

1. **The agent's tone is a database field.** `working_model.tone_directive` is
   injected as a dynamic variable. Alice's says *avoid urgency language, ask for
   the first concrete step*. Bob's says *be blunt, don't ask how he's doing*.
   One agent ID, one system prompt, two audibly different personalities.
   → Interaction Design + Novelty.
2. **The agent interrupts, unprompted.** Crossing the user's stored threshold
   auto-starts the session. This is what separates the project from
   text-to-speech bolted onto a dashboard. → Agentic Depth.
3. **The agent writes back what it learns.** `update_working_model` appends to
   the summary and the UI panel visibly grows mid-conversation.
   → Agentic Depth + persistent-context theme.

## Architecture

```
public/index.html  ──ESM──▶  @elevenlabs/client  ──WebSocket──▶  ElevenLabs agent
       │                            ▲                                   │
       │ fetch                      │ clientTools execute in browser     │ tool calls
       ▼                            └───────────────────────────────────┘
  server.js (Express :3000)
       │
       ▼
  MongoDB Atlas  (db: accountability)
```

**Client tools, not webhook tools.** Tools run in the browser and call
`localhost:3000` directly. No ngrok, no public URL, no deploy. This was a
deliberate time-saving choice — do not migrate to webhook tools.

## Agent

`agent_id = agent_0401kzyg8dmhempvjvn3z9kt0b39`
Configured in the ElevenLabs dashboard (not in this repo).
Agent speaks first, with no fixed first message — the opener is generated from
the injected variables.

### Dynamic variables (all five must be passed or the session errors)

| Variable | Source |
|---|---|
| `user_name` | `users.name` |
| `working_model` | `working_model.summary` |
| `tone_directive` | `working_model.tone_directive` |
| `open_task_count` | count of open `tasks` |
| `trigger_reason` | set client-side: manual click vs. threshold breach |

### System prompt (lives in the dashboard)

```
You are {{user_name}}'s AI coworker. You have worked with them before.

WHAT YOU KNOW ABOUT THEM (learned from their history, not assumed):
{{working_model}}

THEY CURRENTLY HAVE {{open_task_count}} OPEN TASKS.

HOW TO TALK TO THIS PERSON:
{{tone_directive}}

WHY YOU ARE SPEAKING RIGHT NOW:
{{trigger_reason}}

RULES:
- Open by referencing something specific you learned about them. Never generic.
- If their open task count conflicts with what has historically worked for them,
  say so immediately and propose the specific alternative that worked before.
- Cite the evidence: "last time you had five, you finished two."
- Call search_memories before giving any advice about a blocker.
- Call record_event after they agree to a plan.
- Two sentences max per turn. This is speech, not text.
```

## Data model — db `accountability`

| Collection | Shape |
|---|---|
| `users` | `{_id: 'alice', name, role}` |
| `events` | `{user_id, type, detail, open_tasks, completed, completion_rate, at}` — 90 seeded per user, 30 days |
| `memories` | `{user_id, keywords[], text, weight}` — 6 for Alice, 5 for Bob |
| `working_model` | `{_id, threshold, summary, tone_directive, learned_live[]}` |
| `tasks` | `{user_id, title, status, created_at}` |

**The seeded contrast is the demo.** Alice: `threshold 3`, ~35% completion above
it. Bob: `threshold 8`, ~92% completion at 5–7 tasks, stalls *below* 3.

## API (server.js)

| Route | Purpose |
|---|---|
| `GET /api/state/:user` | Everything the page and agent need, one round trip |
| `GET /api/memories/:user?q=` | Keyword scoring → client tool `search_memories` |
| `POST /api/event` | → client tool `record_event` |
| `POST /api/insight` | → client tool `update_working_model` |
| `POST /api/task` | Add task (triggers the intervention check) |
| `POST /api/task/status` | Complete / blocked |
| `POST /api/reset` | Partial reset; `node seed.js` for a full one |

## Explicitly out of scope

Auth, real task CRUD beyond the demo buttons, calendars, Slack/Jira, analytics,
vector search / embeddings (keyword scoring is sufficient at this data size),
mobile, deployment.
