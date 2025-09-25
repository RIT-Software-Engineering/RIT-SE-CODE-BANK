// server/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  const env = process.env.NODE_ENV;
  const isDev = env === "development" || env === "DEV";

  console.error("\nCAUGHT ERROR:", err, "\n");

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
    statusCode: err.statusCode || 500,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    // only send backend stack in dev, under a consistent key
    stack: isDev ? err.stack : undefined,
  });
}

module.exports = errorHandler;
