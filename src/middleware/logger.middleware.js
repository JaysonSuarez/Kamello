/**
 * @file logger.middleware.js
 * @description Simple HTTP request logger middleware for Kamello.
 *
 * Log format: [timestamp] METHOD /path STATUS duration_ms
 * Errors with stack traces are logged in development mode.
 */

/**
 * Middleware: requestLogger
 * Logs each incoming request and its response details.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestLogger(req, res, next) {
  const startAt = Date.now();
  const { method, originalUrl } = req;

  // Hook into the response 'finish' event to log after the response is sent
  res.on('finish', () => {
    const duration = Date.now() - startAt;
    const status = res.statusCode;
    const timestamp = new Date().toISOString();

    const logLine = `[${timestamp}] ${method} ${originalUrl} ${status} ${duration}ms`;

    if (status >= 500) {
      console.error(logLine);
    } else if (status >= 400) {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }
  });

  next();
}

/**
 * Logs an error with its stack trace in development mode.
 * Intended for use inside the global error handler.
 *
 * @param {Error}  err
 * @param {string} context - Short label for where the error occurred
 */
export function logError(err, context = 'Error') {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.error(`[Kamello ${context}]`, err.stack || err.message);
  } else {
    // In production, log just the message to avoid leaking internals
    console.error(`[Kamello ${context}]`, err.message);
  }
}
