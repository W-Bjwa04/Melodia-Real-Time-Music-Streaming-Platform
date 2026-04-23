import AppError from "../errors/AppError.js";
import ApiResponse from "../utils/ApiResponse.js";
import logger from "../config/logger.js";

const handleMongooseCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "Field";
  return new AppError(`${field} already exists`, 409);
};

const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors || {}).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError("Validation failed", 422, errors);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  logger.error("Request error", {
    message: err.message,
    stack: err.stack,
    status: err.statusCode || 500,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?._id || req.user?.userId || "unauthenticated",
    body: req.body,
  });

  if (err.name === "CastError") error = handleMongooseCastError(err);
  if (err.code === 11000) error = handleMongooseDuplicateKey(err);
  if (err.name === "ValidationError") error = handleMongooseValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  if (error.isOperational) {
    return ApiResponse.error(res, error.message, error.statusCode, error.errors || []);
  }

  logger.error("CRITICAL - Non-operational error", { stack: err.stack });
  return ApiResponse.error(res, "Something went wrong. Please try again.", 500);
};

export default errorMiddleware;
