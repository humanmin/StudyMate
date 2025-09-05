// CJS 라우터 파일 (ESM 컨트롤러를 dynamic import로 호출)
const router = require('express').Router();
const { auth } = require('../middlewares/auth');

// 살아있음 체크
router.get('/__alive', (req, res) => res.json({ ok: true, where: 'quizzes' }));

// 컨트롤러 로딩 (ESM)
async function getController() {
  return import('../controllers/quizzes.controller.js'); // 확장자 .js 필수
}

// 생성
router.post('/', auth, async (req, res, next) => {
  try {
    const { createQuiz } = await getController();
    return createQuiz(req, res, next);
  } catch (e) { next(e); }
});

// 조회
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { getQuiz } = await getController();
    return getQuiz(req, res, next);
  } catch (e) { next(e); }
});

// 제출
router.post('/:id/submit', auth, async (req, res, next) => {
  try {
    const { submitQuiz } = await getController();
    return submitQuiz(req, res, next);
  } catch (e) { next(e); }
});

// 오답만
router.get('/:id/wrong-only', auth, async (req, res, next) => {
  try {
    const { getWrongOnly } = await getController();
    return getWrongOnly(req, res, next);
  } catch (e) { next(e); }
});

module.exports = router;
