const express = require('express');
const { prepare: db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function rowToExpense(row) {
  return {
    id: row.id,
    amount: row.amount,
    kind: row.kind,
    categoryId: row.category_id,
    reason: row.reason,
    upiAppId: row.upi_app_id,
    date: row.date,
  };
}

// GET /api/expenses
router.get('/', async (req, res) => {
  const rows = await db('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC').all(
    req.userId
  );
  res.json(rows.map(rowToExpense));
});

// POST /api/expenses
router.post('/', async (req, res) => {
  const { id, amount, kind, categoryId, reason, upiAppId, date } = req.body;

  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (!categoryId || !upiAppId || !date) {
    return res.status(400).json({ error: 'categoryId, upiAppId and date are required' });
  }

  const expenseId = id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db(
    `INSERT INTO expenses (id, user_id, amount, kind, category_id, reason, upi_app_id, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    expenseId,
    req.userId,
    parsedAmount,
    kind === 'income' ? 'income' : 'expense',
    String(categoryId),
    String(reason || 'Expense'),
    String(upiAppId),
    String(date)
  );

  const row = await db('SELECT * FROM expenses WHERE id = ?').get(expenseId);
  res.status(201).json(rowToExpense(row));
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  const result = await db('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(
    req.params.id,
    req.userId
  );
  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ ok: true });
});

module.exports = router;
