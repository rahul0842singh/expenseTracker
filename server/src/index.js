require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const userRoutes = require('./routes/user');
const { verifyMailer } = require('./mailer');
const { migrate } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/user', userRoutes);

// Catches errors passed via next(err) and any that escape a route as a
// synchronous throw. Async handler rejections are covered separately
// below, since Express 4 doesn't route those here on its own.
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// A bug in one request (e.g. a stale token referencing a deleted user)
// should never take the whole server down for every other user.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (server kept running):', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server kept running):', err);
});

const PORT = Number(process.env.PORT || 4545);

(async () => {
  await migrate();
  app.listen(PORT, () => {
    console.log(`ExpenseTracker API listening on port ${PORT} (all interfaces)`);
    verifyMailer();
  });
})().catch((err) => {
  console.error('Failed to start server — could not connect to Turso:', err.message);
  process.exit(1);
});
