"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.ApiError = void 0;
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
/** An error carrying the HTTP status the client should receive. */
class ApiError extends Error {
    statusCode;
    errors;
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = "ApiError";
    }
}
exports.ApiError = ApiError;
/**
 * Wraps an async route handler so a rejected promise reaches the error
 * middleware instead of hanging the request.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
/** 404 fallback for unmatched API routes. */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        errors: [],
    });
}
/**
 * Terminal error middleware. Keeps one consistent failure shape across the API
 * and never leaks stack traces or internal messages in production.
 */
function errorHandler(err, _req, res, _next) {
    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const errors = err instanceof ApiError ? err.errors : [];
    const message = err instanceof ApiError
        ? err.message
        : process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : err instanceof Error
                ? err.message
                : "Something went wrong";
    if (statusCode >= 500) {
        console.error("[API Error]", err);
    }
    res.status(statusCode).json({ success: false, message, errors });
}
