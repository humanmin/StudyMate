// CJS 버전 app.js (라우트 등록 담당)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// 헬스체크
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ===== 라우트 연결 (여기서 반드시 등록) =====
const authRoutes = require('./routes/auth.routes');         // 있으면 사용, 없으면 주석
const subjectRoutes = require('./routes/subjects.routes');  // 있으면 사용, 없으면 주석
const noteRoutes = require('./routes/notes.routes');        // 있으면 사용, 없으면 주석
const quizRoutes = require('./routes/quizzes.routes');      // ★ 중요

if (authRoutes)   app.use('/api/auth', authRoutes);
if (subjectRoutes)app.use('/api/subjects', subjectRoutes);
if (noteRoutes)   app.use('/api/notes', noteRoutes);
app.use('/api/quizzes', quizRoutes); // 최소 이것 하나는 반드시

// ===== 등록된 라우트 덤프 (안전 가드 버전) =====
app.get('/api/_routes', (req, res) => {
  try {
    const list = [];
    (app._router?.stack || []).forEach((layer) => {
      // 직접 라우트
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase());
        list.push({ base: '', path: layer.route.path, methods });
      }
      // 하위 Router
      else if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
        const base = layer.regexp ? layer.regexp.toString() : '';
        layer.handle.stack.forEach((sub) => {
          if (sub.route && sub.route.path) {
            const methods = Object.keys(sub.route.methods || {}).map(m => m.toUpperCase());
            list.push({ base, path: sub.route.path, methods });
          }
        });
      }
    });
    res.json({ routes: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 404는 맨 마지막
app.use((req, res) => res.status(404).json({ success: false, error: { message: 'Not Found' } }));

module.exports = app;
