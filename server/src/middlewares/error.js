// C:\Users\minjin\KMJ\server\src\middlewares\error.js
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: { message: err.message || 'Server error' }
  });
}
module.exports = { errorHandler };
