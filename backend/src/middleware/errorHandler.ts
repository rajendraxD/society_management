import { NextFunction, Request, Response } from "express";

/** An error carrying the HTTP status the client should receive. */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: unknown[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wraps an async route handler so a rejected promise reaches the error
 * middleware instead of hanging the request.
 */
export const asyncHandler =
  <T extends Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };

/** 404 fallback for unmatched API routes. */
export function notFoundHandler(req: Request, res: Response) {
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
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const errors = err instanceof ApiError ? err.errors : [];

  const message =
    err instanceof ApiError
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
