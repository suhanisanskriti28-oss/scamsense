export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Security: Never leak full internal stack traces to clients
  const responsePayload = {
    error: err.message || "An unexpected internal server error occurred",
    status: statusCode,
  };

  if (err.details) {
    responsePayload.details = err.details;
  }

  res.status(statusCode).json(responsePayload);
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Not Found - ${req.originalUrl}` });
}
