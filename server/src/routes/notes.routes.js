const router = require('express').Router();
const { auth } = require('../middlewares/auth');
const { listNotes, createNote } = require('../controllers/notes.controller');

// ✅ 살아있음 체크
router.get('/__alive', (req,res)=>res.json({ok:true, where:'notes'}));

router.get('/', auth, listNotes);
router.post('/', auth, createNote);

module.exports = router;
