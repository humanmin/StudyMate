// C:\Users\minjin\KMJ\server\src\middlewares\auth.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success:false, error:{message:'No token'} });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success:false, error:{message:'Invalid token'} });
  }
}
module.exports = { auth };
