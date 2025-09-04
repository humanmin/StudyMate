const { query } = require('../db');

// 퀴즈 생성
async function createQuiz(req, res, next) {
  try {
    const { subject_id, title, description, items } = req.body;
    if (!subject_id || !title || !items) {
      throw Object.assign(new Error('subject_id, title, items required'), { status: 400 });
    }
    // 본인 소유 과목인지 확인
    const own = await query('SELECT id FROM subjects WHERE id=? AND user_id=?', [subject_id, req.user.id]);
    if (!own.length) throw Object.assign(new Error('Subject not found'), { status: 404 });

    const r = await query(
      'INSERT INTO quizzes (subject_id, title, description) VALUES (?, ?, ?)',
      [subject_id, title, description]
    );
    const quizId = r.insertId;

    // items 저장
    for (const it of items) {
      await query(
        'INSERT INTO quiz_items (quiz_id, question, choices_json, answer, item_type) VALUES (?, ?, ?, ?, ?)',
        [quizId, it.question, JSON.stringify(it.choices), it.answer, it.item_type || 'mcq']
      );
    }

    res.json({ success: true, id: quizId });
  } catch (e) { next(e); }
}

// 퀴즈 조회
async function getQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const quiz = await query('SELECT id, subject_id, title, description FROM quizzes WHERE id=?', [id]);
    if (!quiz.length) throw Object.assign(new Error('Quiz not found'), { status: 404 });
    const items = await query('SELECT id, question, choices_json, item_type FROM quiz_items WHERE quiz_id=?', [id]);
    const mapped = items.map(it => ({
      id: it.id,
      question: it.question,
      choices: JSON.parse(it.choices_json),
      item_type: it.item_type
    }));
    res.json({ success: true, quiz: quiz[0], items: mapped });
  } catch (e) { next(e); }
}

module.exports = { createQuiz, getQuiz };
