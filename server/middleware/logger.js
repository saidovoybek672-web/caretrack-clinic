const crypto = require('crypto');

function requestLogger(req, res, next) {
  req.id = crypto.randomUUID();
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

module.exports = requestLogger;
