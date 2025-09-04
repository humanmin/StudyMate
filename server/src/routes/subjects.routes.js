const router = require('express').Router();
const { auth } = require('../middlewares/auth');
const { listSubjects, createSubject } = require('../controllers/subjects.controller');

// ✅ 살아있음 체크
router.get('/__alive', (req,res)=>res.json({ok:true, where:'subjects'}));

router.get('/', auth, listSubjects);
router.post('/', auth, createSubject);

module.exports = router;
