# AI Coworker (Accountabiity Bot)

**It doesn't tell you how to work. It learns how you work.**

A voice agent that reads its intervention threshold and its speaking tone out of
MongoDB instead of having them coded in. Two users get audibly different
behaviour from **one agent, one system prompt, one code path** — because the
difference lives in the database, not in an `if` statement.

Built at the MongoDB Persistent Context Sprint (Pier 48, SF).

## The demo in 30 seconds

Alice is a product designer whose 30-day history shows she reliably finishes 2–3
tasks a day and collapses past 3. Bob is an infra engineer who runs 5–7 in
parallel at 92% completion and stalls when he has *fewer* than 3.

Add a 4th task as Alice and the agent **interrupts you, unprompted** — warm,
unhurried, citing what actually happened last time she had five open. Add a 6th
task as Bob and nothing happens, because 6 is a normal day for him. Press Talk
and he gets one blunt sentence telling him nothing is wrong.

Neither rule was programmed. Alice's threshold is `3` and Bob's is `8`, both
rows in `working_model`. The agent's personality is a string field —
`working_model.tone_directive` — injected as a dynamic variable at session
start.

## What it does

- **Learns from history.** 90 seeded behavioural events per user over 30 days,
  plus keyword-scored memories the agent searches mid-conversation before giving
  advice.
- **Interrupts on its own.** Crossing your stored threshold auto-starts a voice
  session. Nobody presses a button.
- **Writes back what it learns.** `update_working_model` appends new insights to
  the user's summary, and the "What I've learned about you" panel grows on
  screen while you talk.

## Built during the event

Everything in this repository was written during the sprint: the seed data and
behavioural model, the Express + Atlas API, the browser client, the threshold
intervention logic, and the four client tools. The ElevenLabs agent itself
(system prompt, tool declarations, voice) is configured in the ElevenLabs
dashboard rather than in code — the prompt is reproduced in `CONTEXT.md`.

The only vendored file is `public/elevenlabs.js`, the `@elevenlabs/client`
1.17.0 browser bundle, committed so the demo runs without a CDN on venue wifi.

## Stack

Node 20 (ESM), Express, MongoDB Atlas (driver 6.10.0), ElevenLabs Agents
Platform via `@elevenlabs/client`. Vanilla HTML and JavaScript — no framework,
no bundler, no build step.

Tools are **client tools**, executing in the browser and calling `localhost:3000`
directly, so there is no ngrok tunnel and nothing to deploy.

## Run it

```bash
npm install
echo 'MONGODB_URI="mongodb+srv://..."' > .env
node seed.js      # wipes and reseeds Atlas; safe to rerun between demo takes
node server.js    # http://localhost:3000
```

Then click a user — that grants mic access and unlocks browser audio — and start
adding tasks.

## Architecture

```
public/index.html  ──ESM──▶  @elevenlabs/client  ──WebSocket──▶  ElevenLabs agent
       │                            ▲                                   │
       │ fetch                      │ client tools run in the browser    │ tool calls
       ▼                            └───────────────────────────────────┘
  server.js (Express :3000)
       │
       ▼
  MongoDB Atlas  (db: accountability)
```

Collections: `users`, `events`, `memories`, `working_model`, `tasks`.
See `CONTEXT.md` for the data model and `SPEC.md` for the functional spec.

## Scope

A hackathon demo, not a product. No auth, no tests, no build step, two fixed
users. Those are deliberate omissions.
