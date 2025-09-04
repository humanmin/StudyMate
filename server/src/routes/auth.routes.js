const router = require('express').Router();
const { register, login } = require('../controllers/auth.controller');

// ✅ 살아있음 체크
router.get('/__alive', (req,res)=>res.json({ok:true, where:'auth'}));

router.post('/register', register);
router.post('/login', login);

module.exports = router;
