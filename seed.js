// seed.js — run once:  node seed.js
// Requires .env with MONGODB_URI="mongodb+srv://..."
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('accountability');

// ---------- helpers ----------
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

/** Generate N days of history for a user.
 *  loadPattern: array of [openTasks, completed] pairs, cycled over the days. */
function genEvents(userId, days, loadPattern) {
  const out = [];
  for (let d = days; d > 0; d--) {
    const [open, done] = loadPattern[d % loadPattern.length];
    out.push({
      user_id: userId,
      type: 'day_planned',
      detail: `Committed to ${open} tasks.`,
      open_tasks: open,
      at: daysAgo(d),
    });
    out.push({
      user_id: userId,
      type: 'day_closed',
      detail: `Finished ${done} of ${open}.`,
      open_tasks: open,
      completed: done,
      completion_rate: +(done / open).toFixed(2),
      at: daysAgo(d),
    });
    if (done < open) {
      out.push({
        user_id: userId,
        type: 'blocked',
        detail: `Carried ${open - done} tasks to the next day without touching them.`,
        open_tasks: open,
        at: daysAgo(d),
      });
    }
  }
  return out;
}

// ---------- data ----------
const users = [
  { _id: 'alice', name: 'Alice', role: 'Product designer' },
  { _id: 'bob', name: 'Bob', role: 'Infra engineer' },
];

// Alice: falls apart past 3. Bob: thrives wide.
const aliceEvents = genEvents('alice', 30, [[5, 2], [5, 1], [2, 2], [6, 2], [3, 3], [5, 2], [2, 2]]);
const bobEvents = genEvents('bob', 30, [[6, 6], [7, 6], [5, 5], [8, 7], [6, 6], [4, 4], [7, 7]]);

const workingModels = [
  {
    _id: 'alice',
    user_id: 'alice',
    threshold: 3,
    summary: [
      'Alice reliably finishes 2 to 3 tasks a day. Past 3, her completion rate collapses to roughly 35% and the extra tasks are usually never started at all, just carried forward.',
      'Her blockers are almost always "the task is too large to begin", not lack of time. Asking her for the single first concrete step has unblocked her 4 out of 5 times.',
      'When given a ranked list she picks the top item and starts. When given an unranked list she reorganises it instead of working.',
    ].join(' '),
    tone_directive:
      'Warm and unhurried, with bright upbeat energy — a friendly Californian register, casual and a little bubbly, but never ditzy and never sarcastic. Never stack more than one suggestion per turn. Do not tell her what to prioritise — ask her which item matters most, then ask for its first concrete step. Avoid urgency language; it makes her freeze.',
    voice_id: null,
    updated_at: new Date(),
  },
  {
    _id: 'bob',
    user_id: 'bob',
    threshold: 8,
    summary: [
      'Bob runs 5 to 7 tasks in parallel and closes most of them. Wide load is normal for him and narrowing it has historically slowed him down.',
      'His failure mode is the opposite of overload: he stalls when he has fewer than 3 things open, because he waits on other people instead of context-switching.',
      'He rejects check-ins on work that is going fine and responds badly to being asked how he feels about his workload.',
    ].join(' '),
    tone_directive:
      'Blunt and brief. Dry deadpan humour, never warmth. One sentence where possible. Do not offer encouragement, do not ask how he is doing, do not suggest cutting scope unless he is above 8 open tasks. If nothing is wrong, say so and get out of the way. ' +
      'IF AND ONLY IF he is above 8 open tasks, open the conversation with exactly this line, word for word, before anything else: ' +
      '"Nine open. Bob, I have watched you juggle seven of these without blinking, so I am genuinely impressed and slightly concerned." ' +
      'Then say one short sentence about which one to drop. Do not repeat the line later in the conversation.',
    voice_id: null,
    updated_at: new Date(),
  },
];

const memories = [
  // Alice
  { user_id: 'alice', keywords: ['overwhelm', 'too many', 'five tasks', 'overload'], text: 'On days Alice opened 5+ tasks she finished an average of 1.8. On days she opened 2-3 she finished all of them.', weight: 0.95 },
  { user_id: 'alice', keywords: ['stuck', 'too big', 'where to start', 'blocked'], text: 'Alice has been blocked 7 times by a task feeling too large. Breaking it into a named first step resolved it 4 of 5 times it was tried.', weight: 0.9 },
  { user_id: 'alice', keywords: ['priority', 'ranked', 'which first'], text: 'Alice starts work immediately when the list is already ranked; she reorganises instead of starting when it is not.', weight: 0.7 },
  { user_id: 'alice', keywords: ['deadline', 'urgent', 'pressure'], text: 'Urgency framing has preceded 3 of Alice\'s worst completion days. She freezes rather than accelerates.', weight: 0.8 },
  { user_id: 'alice', keywords: ['afternoon', 'energy', 'time of day'], text: 'Alice completes 80% of her finished tasks before 1pm.', weight: 0.6 },
  { user_id: 'alice', keywords: ['carry over', 'unfinished', 'yesterday'], text: 'Tasks Alice carries forward twice are almost never completed; they are eventually deleted.', weight: 0.75 },
  // Bob
  { user_id: 'bob', keywords: ['overwhelm', 'too many', 'five tasks', 'overload'], text: 'Bob averages 92% completion at 5-7 open tasks. Five is a normal day for him, not a warning sign.', weight: 0.95 },
  { user_id: 'bob', keywords: ['stalled', 'idle', 'waiting', 'few tasks'], text: 'Bob\'s slowest days are his lightest ones. Below 3 open tasks he waits on other people instead of switching context.', weight: 0.9 },
  { user_id: 'bob', keywords: ['check in', 'how are you', 'feelings'], text: 'Bob has dismissed 5 of 6 wellbeing check-ins on work that was progressing normally.', weight: 0.85 },
  { user_id: 'bob', keywords: ['cut scope', 'drop', 'fewer'], text: 'The one time Bob was pushed down to 2 tasks, his output dropped by half that week.', weight: 0.8 },
  { user_id: 'bob', keywords: ['blocked', 'dependency', 'review'], text: 'Bob\'s real blockers are external: waiting on code review or another team, not workload.', weight: 0.75 },
];

const tasks = [
  { user_id: 'alice', title: 'Redesign onboarding empty states', status: 'open', created_at: daysAgo(1) },
  { user_id: 'alice', title: 'Write copy for the upgrade modal', status: 'open', created_at: daysAgo(0) },
  { user_id: 'bob', title: 'Shard the events collection', status: 'open', created_at: daysAgo(2) },
  { user_id: 'bob', title: 'Fix flaky CI on arm64', status: 'open', created_at: daysAgo(2) },
  { user_id: 'bob', title: 'Upgrade the driver to 6.x', status: 'open', created_at: daysAgo(1) },
  { user_id: 'bob', title: 'Review Priya\'s migration PR', status: 'open', created_at: daysAgo(1) },
  { user_id: 'bob', title: 'Rotate the staging credentials', status: 'open', created_at: daysAgo(1) },
  { user_id: 'bob', title: 'Cut the 4.2 release branch', status: 'open', created_at: daysAgo(0) },
  { user_id: 'bob', title: 'Debug the p99 latency spike', status: 'open', created_at: daysAgo(0) },
];

// ---------- run ----------
async function main() {
  await client.connect();
  const names = ['users', 'events', 'memories', 'working_model', 'tasks'];
  await Promise.all(names.map((n) => db.collection(n).deleteMany({})));

  await db.collection('users').insertMany(users);
  await db.collection('events').insertMany([...aliceEvents, ...bobEvents]);
  await db.collection('memories').insertMany(memories);
  await db.collection('working_model').insertMany(workingModels);
  await db.collection('tasks').insertMany(tasks);

  await db.collection('events').createIndex({ user_id: 1, at: -1 });
  await db.collection('memories').createIndex({ user_id: 1, keywords: 1 });

  for (const u of users) {
    const n = await db.collection('events').countDocuments({ user_id: u._id });
    const t = await db.collection('tasks').countDocuments({ user_id: u._id, status: 'open' });
    const wm = workingModels.find((w) => w._id === u._id);
    console.log(`${u.name}: ${n} events, ${t} open tasks, threshold ${wm.threshold}`);
  }
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
