// C:\Users\minjin\KMJ\server\src\controllers\quizzes.controller.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { query } = require('../db');

/** ───────── 유틸: choices 방어적 정규화 ───────── **/
function normalizeChoices(raw) {
  try {
    if (Array.isArray(raw)) return raw;
    if (raw == null) return [];
    if (typeof raw !== 'string') return [];

    const s = raw.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      return JSON.parse(s); // 올바른 JSON 배열 텍스트
    }
    // "ㅏ,ㄱ,ㅂ" 같은 콤마 문자열 → 배열
    return s.split(',').map(x => x.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function toChoicesArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try { return JSON.parse(s); } catch { return []; }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }
  return [];
}

/** ───────── 기본: 퀴즈 생성/조회 ───────── **/

// 퀴즈 생성 (메타 + 문항 저장)
async function createQuiz(req, res, next) {
  try {
    const { subject_id, title, description = null, items = [] } = req.body;
    if (!subject_id || !title || !Array.isArray(items)) {
      throw Object.assign(new Error('subject_id, title, items required'), { status: 400 });
    }

    // 본인 소유 과목 확인
    const own = await query(
      'SELECT id FROM subjects WHERE id=? AND user_id=?',
      [subject_id, req.user.id]
    );
    if (!own.length) throw Object.assign(new Error('Subject not found'), { status: 404 });

    // 퀴즈 메타 저장
    const r = await query(
      'INSERT INTO quizzes (subject_id, title, description) VALUES (?, ?, ?)',
      [subject_id, title, description]
    );
    const quizId = r.insertId;

    // 문항 저장 (choices는 JSON 문자열로 보관)
    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const arr = toChoicesArray(it.choices || []);
      await query(
        'INSERT INTO quiz_items (quiz_id, question, choices_json, answer, item_type, ord) VALUES (?, ?, ?, ?, ?, ?)',
        [quizId, it.question || '', JSON.stringify(arr), it.answer || '', it.item_type || 'mcq', i + 1]
      );
    }

    res.json({ success: true, id: quizId });
  } catch (e) {
    next(e);
  }
}

// 퀴즈 조회 (메타 + 문항 목록)
async function getQuiz(req, res, next) {
  try {
    const { id } = req.params;

    const meta = await query(
      'SELECT id, subject_id, title, description, created_at FROM quizzes WHERE id=?',
      [id]
    );
    if (!meta.length) throw Object.assign(new Error('Quiz not found'), { status: 404 });

    const items = await query(
      'SELECT id, question, choices_json, answer, item_type, ord FROM quiz_items WHERE quiz_id=? ORDER BY ord',
      [id]
    );

    res.json({
      success: true,
      quiz: meta[0],
      items: items.map(it => ({
        id: it.id,
        question: it.question,
        choices: normalizeChoices(it.choices_json), // 문자열/JSON 모두 안전 처리
        item_type: it.item_type
      }))
    });
  } catch (e) {
    next(e);
  }
}

/** ───────── 제출/채점 + 오답만 ───────── **/

// 제출/채점
async function submitQuiz(req, res, next) {
  try {
    const quizId = Number(req.params.id);
    const { answers = [] } = req.body; // [{ item_id, user_answer }]
    if (!Array.isArray(answers)) {
      throw Object.assign(new Error('answers must be array'), { status: 400 });
    }

    // 문항/정답 로드
    const items = await query(
      'SELECT id, answer FROM quiz_items WHERE quiz_id=? ORDER BY ord',
      [quizId]
    );
    if (!items.length) throw Object.assign(new Error('Quiz not found'), { status: 404 });

    const mapById = new Map(items.map(it => [Number(it.id), it]));
    let score = 0;
    const rows = []; // [submission_id, item_id, user_answer, is_correct]

    for (const a of answers) {
      const itemId = Number(a.item_id);
      const item = mapById.get(itemId);
      if (!item) continue;
      const ua = String(a.user_answer ?? '');
      const isCorrect = ua === String(item.answer);
      if (isCorrect) score++;
      rows.push([/*submission_id later*/, itemId, ua, isCorrect ? 1 : 0]);
    }

    const total = items.length;

    // 제출 저장 (컬럼명: total_items, submitted_at)
    const r = await query(
      'INSERT INTO quiz_submissions (quiz_id, user_id, score, total_items, submitted_at) VALUES (?, ?, ?, ?, NOW())',
      [quizId, req.user.id, score, total]
    );
    const submissionId = r.insertId;

    for (const row of rows) {
      row[0] = submissionId;
      await query(
        'INSERT INTO quiz_submission_items (submission_id, item_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
        row
      );
    }

    res.json({ success: true, submission_id: submissionId, score, total });
  } catch (e) {
    next(e);
  }
}

// 최신 제출의 오답만
async function getWrongOnly(req, res, next) {
  try {
    const quizId = Number(req.params.id);

    // 최신 제출 1건
    const sub = await query(
      'SELECT id FROM quiz_submissions WHERE quiz_id=? AND user_id=? ORDER BY id DESC LIMIT 1',
      [quizId, req.user.id]
    );
    if (!sub.length) return res.json({ success: true, items: [] });

    const submissionId = sub[0].id;

    const wrong = await query(
      `SELECT qi.id, qi.question, 
              COALESCE(qi.choices_json, JSON_EXTRACT(qi.choices, '$')) AS choices_any,
              qi.item_type, qi.ord
         FROM quiz_submission_items si
         JOIN quiz_items qi ON qi.id = si.item_id
        WHERE si.submission_id=? AND si.is_correct=0
        ORDER BY qi.ord`,
      [submissionId]
    );

    res.json({
      success: true,
      items: wrong.map(it => ({
        id: it.id,
        question: it.question,
        choices: normalizeChoices(it.choices_any), // choices_json or choices(JSON)
        item_type: it.item_type
      }))
    });
  } catch (e) {
    next(e);
  }
}

export { createQuiz, getQuiz, submitQuiz, getWrongOnly };
