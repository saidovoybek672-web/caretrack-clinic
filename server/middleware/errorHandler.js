function notFound(req, res) {
  res.status(404).json({ error: 'Marshrut topilmadi' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Ichki server xatosi',
  });
}

module.exports = { notFound, errorHandler };
