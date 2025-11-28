const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req,res) => {
  const db = getDb();
  const conv = { _id: uuidv4(), messages: [], createdAt: new Date() };
  await db.collection('conversations').insertOne(conv);
  res.json({ conversationId: conv._id });
});

router.get('/:id', async (req,res) => {
  const db = getDb();
  const id = req.params.id;
  const conv = await db.collection('conversations').findOne({ _id: id });
  if(!conv) return res.status(404).json({ error: 'not found' });
  res.json(conv);
});

module.exports = router;
