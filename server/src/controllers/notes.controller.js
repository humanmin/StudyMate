const { query } = require('../db');

// 노트 목록
async function listNotes(req, res, next) {
  try {
    const { subject_id } = req.query;
    const params = [req.user.id];
    let sql = `SELECT n.id, n.title, LEFT(n.content_md,160) AS preview, n.tags, n.updated_at, s.title AS subject
               FROM notes n JOIN subjects s ON s.id=n.subject_id
               WHERE s.user_id=?`;
    if (subject_id) { sql += ' AND s.id=?'; params.push(subject_id); }
    sql += ' ORDER BY n.updated_at DESC LIMIT 100';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
}

// 노트 생성
async function createNote(req, res, next) {
  try {
    const { subject_id, title, content_md, tags=null } = req.body;
    if (!subject_id || !title || !content_md)
      throw Object.assign(new Error('subject_id, title, content_md required'), { status: 400 });
    // 자신의 과목인지 확인
    const own = await query('SELECT id FROM subjects WHERE id=? AND user_id=?', [subject_id, req.user.id]);
    if (!own.length) throw Object.assign(new Error('Subject not found'), { status: 404 });
    const r = await query(
      'INSERT INTO notes (subject_id, title, content_md, tags) VALUES (?, ?, ?, ?)',
      [subject_id, title, content_md, tags]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) { next(e); }
}

module.exports = { listNotes, createNote };
