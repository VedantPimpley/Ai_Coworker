# CLAUDE.md

## What this is

`AccountabilityBot` — a hackathon demo, not a product. Built for the MongoDB
Persistent Context Sprint (Pier 48, SF). **Submissions close 5:00 PM PT today.**

Primary objective: win **Best Project Built with ElevenLabs**.
Secondary: place in the overall top 3.

## Working rules

1. **The clock outranks the code.** A working demo with ugly code wins. A clean
   refactor that misses 5:00 PM scores zero. Never refactor unprompted.
2. **Never break the demo path to improve something adjacent.** If a change
   risks the Alice→Bob contrast or the autostart interruption, don't make it.
3. **No new dependencies** unless the current one is provably broken. Every npm
   install is a minute you don't have.
4. **No auth, no tests, no error boundaries, no TypeScript, no build step.**
   These are deliberate omissions, not oversights. Do not add them.
5. **Two users only: `alice` and `bob`.** No user creation, no login.
6. **Never hardcode a user's name in behavioural logic.** Thresholds and tone
   come from MongoDB. This is the entire thesis of the project — an
   `if (user === 'alice')` anywhere in the intervention path invalidates the
   demo and the pitch.

## Output style

The user has ADHD. Follow `/mnt/skills/user/i-have-adhd` conventions:
lead with the next action, number multi-step work, restate state each turn,
specific time estimates, no preamble or recap, suppress tangents.

## Stack

Node 20.16 (ESM, `"type": "module"`), Express, MongoDB Atlas driver `6.10.0`
(pinned — 7.x requires Node ≥20.19 and will warn/fail), vanilla HTML+JS, no
framework, no bundler. ElevenLabs Agents Platform via `@elevenlabs/client`.

## Commands

```bash
node seed.js      # wipes and reseeds Atlas. Safe to rerun between demo takes.
node server.js    # http://localhost:3000, serves ./public and the API
```

## Constraints that have already bitten

- Atlas password must be alphanumeric. `!` `:` `@` in the password produce
  `MongoParseError: mongodb+srv URI cannot have port number` or auth failures.
- Browsers block autoplay audio without a prior user gesture. Selecting a user
  requests mic permission and unlocks it. **The demo script must click a user
  before adding tasks**, or the interruption is silent.
- ElevenLabs client tool names are case-sensitive and must match the dashboard
  config exactly.
