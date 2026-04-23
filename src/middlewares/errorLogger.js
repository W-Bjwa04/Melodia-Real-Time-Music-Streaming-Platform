import logger from "../config/logger.js";

const errorLogger = (err, req, res, next) => {
  logger.error("Unhandled Express Error", {
    message: err.message,
    stack: err.stack,
    status: err.status || err.statusCode || 500,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.userId || "unauthenticated",
    userAgent: req.headers["user-agent"],
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  next(err);
};

export default errorLogger;
