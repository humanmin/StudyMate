// C:\Users\minjin\KMJ\server\src\app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json()); // ★ 반드시 라우트보다 먼저
app.use(morgan('dev'));

// 기본 헬스
app.get('/api/health', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// ★ 라우트 연결 — 이 3줄이 실제로 있어야 함
const authRoutes = require('./routes/auth.routes');
const subjectRoutes = require('./routes/subjects.routes');
const noteRoutes = require('./routes/notes.routes');

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notes', noteRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

const quizRoutes = require('./routes/quizzes.routes');
app.use('/api/quizzes', quizRoutes);

// 404
app.use((req, res) =>
  res.status(404).json({ success:false, error:{ message:'Not Found' } })
);
