const router = require('express').Router();

// ★ 살아있음 체크만 먼저
router.get('/__alive', (req, res) => res.json({ ok: true, where: 'quizzes' }));

module.exports = router; // ★ 반드시 export
