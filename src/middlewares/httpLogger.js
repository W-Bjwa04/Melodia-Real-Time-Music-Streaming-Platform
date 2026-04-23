import morgan from "morgan";
import logger from "../config/logger.js";

const stream = {
  write: (message) => logger.http(message.trim()),
};

morgan.token("body", (req) => {
  const body = { ...(req.body || {}) };
  if (body.password) body.password = "***REDACTED***";
  if (body.token) body.token = "***REDACTED***";
  return JSON.stringify(body);
});

morgan.token("user-id", (req) => req.user?.userId || "unauthenticated");

const morganFormat =
  ":method :url :status :res[content-length] bytes - :response-time ms | user=:user-id | body=:body";

const httpLogger = morgan(morganFormat, { stream });

export default httpLogger;
