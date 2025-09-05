// CJS 버전 server.js (listen 담당)
const app = require('./app');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on :${PORT}`);
});
