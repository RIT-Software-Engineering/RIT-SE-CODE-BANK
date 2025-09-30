// server/middleware/errorHandler.js
const util = require('util');

function safeSerializeError(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err.stack) return err.stack;

  try {
    return util.inspect(err, { depth: 10, colors: false });
  } catch (e) {
    try {
      return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
    } catch (e2) {
      return String(err);
    }
  }
}

function deriveErrorName(err) {
  if (!err) return 'Error';
  if (err.name && err.name !== 'Error') return err.name;
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    return 'Prisma Error';
  }
  if (typeof err.message === 'string' && /prisma/i.test(err.message)) {
    return 'Prisma Error';
  }
  if (err.code) return String(err.code) + ' Error';
  return 'Error';
}

function conciseMessage(err) {
  if (!err) return 'Internal Server Error';
  // Prefer a real message string; if missing, return generic
  const hasMessage = err && typeof err.message === 'string' && err.message.trim().length > 0;
  if (!hasMessage) return 'Internal Server Error';
  const msg = err.message;
  // Split on double newlines (Prisma includes invocation then message) and prefer the last block
  const parts = msg.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : msg;
  // If last block contains multiple lines, take the last non-empty line which tends to be the human message
  const lines = last.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const candidate = lines.length ? lines[lines.length - 1] : last;
  // Keep concise (limit length)
  return candidate.length > 300 ? candidate.slice(0, 300) + '...' : candidate;
}

function errorHandler(err, req, res, next) {
  const env = process.env.NODE_ENV;
  const isDev = env === 'development' || env === 'DEV';

  // Log full error server-side for debugging
  console.error('\nCAUGHT ERROR:', err, '\n');

  const statusCode = err && err.statusCode ? err.statusCode : 500;
  const name = deriveErrorName(err);
  const message = conciseMessage(err);

  res.status(statusCode).json({
    name,
    error: message,
    statusCode,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    // Keep verbose details in `stack` so the UI header stays concise
    stack: isDev ? safeSerializeError(err) : undefined,
  });
}

module.exports = errorHandler;
