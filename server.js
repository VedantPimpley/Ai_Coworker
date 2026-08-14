// server.js — node server.js  → http://localhost:3000
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db('accountability');
console.log('Atlas connected');

// ---- 1. Everything the page + agent needs, in one round trip ----
app.get('/api/state/:user', async (req, res) => {
  const id = req.params.user;
  const [user, wm, tasks] = await Promise.all([
    db.collection('users').findOne({ _id: id }),
    db.collection('working_model').findOne({ _id: id }),
    db.collection('tasks').find({ user_id: id, status: 'open' }).toArray(),
  ]);
  if (!user || !wm) return res.status(404).json({ error: 'unknown user' });

  res.json({
    user_id: id,
    user_name: user.name,
    working_model: wm.summary,
    tone_directive: wm.tone_directive,
    threshold: wm.threshold,
    voice_id: wm.voice_id || null,
    open_task_count: String(tasks.length),
    tasks,
  });
});

// ---- 2. Keyword memory search (client tool: search_memories) ----
app.get('/api/memories/:user', async (req, res) => {
  const id = req.params.user;
  const q = (req.query.q || '').toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 3);

  const all = await db.collection('memories').find({ user_id: id }).toArray();
  const scored = all
    .map((m) => {
      const hay = (m.keywords.join(' ') + ' ' + m.text).toLowerCase();
      const hits = words.filter((w) => hay.includes(w)).length;
      return { ...m, score: hits + m.weight };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json({ memories: scored.map((m) => m.text) });
});

// ---- 3. Log what happened (client tool: record_event) ----
app.post('/api/event', async (req, res) => {
  const { user_id, event_type, detail, open_tasks } = req.body;
  await db.collection('events').insertOne({
    user_id, type: event_type, detail,
    open_tasks: open_tasks ?? null,
    source: 'conversation',
    at: new Date(),
  });
  res.json({ ok: true, saved: detail });
});

// ---- 4. Learn something durable (client tool: update_working_model) ----
app.post('/api/insight', async (req, res) => {
  const { user_id, insight } = req.body;
  const wm = await db.collection('working_model').findOne({ _id: user_id });
  const updated = wm.summary + ' ' + insight;
  await db.collection('working_model').updateOne(
    { _id: user_id },
    { $set: { summary: updated, updated_at: new Date() },
      $push: { learned_live: { insight, at: new Date() } } }
  );
  res.json({ ok: true, working_model: updated, insight });
});

// ---- Task add / status, for the demo buttons ----
app.post('/api/task', async (req, res) => {
  const { user_id, title } = req.body;
  await db.collection('tasks').insertOne({
    user_id, title, status: 'open', created_at: new Date(),
  });
  const count = await db.collection('tasks').countDocuments({ user_id, status: 'open' });
  res.json({ ok: true, open_task_count: count });
});

app.post('/api/task/status', async (req, res) => {
  const { task_id, status } = req.body;
  const { ObjectId } = await import('mongodb');
  await db.collection('tasks').updateOne(
    { _id: new ObjectId(task_id) }, { $set: { status } }
  );
  res.json({ ok: true });
});

// ---- Reset between demo takes ----
app.post('/api/reset', async (req, res) => {
  await db.collection('tasks').deleteMany({ source: undefined, created_at: { $gte: new Date(Date.now() - 3600000) } });
  await db.collection('working_model').updateMany({}, { $unset: { learned_live: '' } });
  res.json({ ok: true, note: 'run node seed.js for a full reset' });
});

app.listen(3000, () => console.log('http://localhost:3000'));
