const express = require('express');
const { prepare: db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    monthlyBudget: row.monthly_budget === null || row.monthly_budget === undefined
      ? null
      : row.monthly_budget,
  };
}

// GET /api/user/me
router.get('/me', async (req, res) => {
  const user = await db('SELECT id, name, email, monthly_budget FROM users WHERE id = ?').get(
    req.userId
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toPublicUser(user));
});

// PUT /api/user/budget  { monthlyBudget }
router.put('/budget', async (req, res) => {
  const amount = Number(req.body.monthlyBudget);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'monthlyBudget must be a positive number' });
  }

  await db('UPDATE users SET monthly_budget = ? WHERE id = ?').run(amount, req.userId);

  const user = await db('SELECT id, name, email, monthly_budget FROM users WHERE id = ?').get(
    req.userId
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(toPublicUser(user));
});

module.exports = router;
