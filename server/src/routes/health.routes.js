const router = require('express').Router();
const { pool } = require('../db');

router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get('/db-ping', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: !!rows[0].ok });
  } catch (e) { next(e); }
});

module.exports = router;
