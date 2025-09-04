const { query } = require('../db');

// 과목 목록
async function listSubjects(req, res, next) {
  try {
    const rows = await query(
      'SELECT id, title, grade_band, color FROM subjects WHERE user_id=? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
}

// 과목 생성
async function createSubject(req, res, next) {
  try {
    const { title, grade_band = '고', color = null } = req.body;
    if (!title) throw Object.assign(new Error('title required'), { status: 400 });

    const r = await query(
      'INSERT INTO subjects (user_id, title, grade_band, color) VALUES (?, ?, ?, ?)',
      [req.user.id, title, grade_band, color]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) { next(e); }
}

module.exports = { listSubjects, createSubject };