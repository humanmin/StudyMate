// C:\Users\minjin\KMJ\server\src\controllers\auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      throw Object.assign(new Error('email, password, name required'), { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, hash, name, 'student']
    );
    res.json({ success: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      e.status = 409; e.message = 'Email already registered';
    }
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const rows = await query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email=? LIMIT 1',
      [email]
    );
    if (!rows.length) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (e) { next(e); }
}

module.exports = { register, login };
