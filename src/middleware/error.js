function notFound(_req, res) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  res.status(status).json({ message: error.message || 'Internal server error' });
}

module.exports = { notFound, errorHandler };
