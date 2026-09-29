import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "./errorHandler.js";

type RequestPart = "body" | "params" | "query";

/**
 * Validates one part of the request against a zod schema and replaces it with
 * the parsed (typed, coerced) value. Never trust the client payload — every
 * mutating route runs through here before its controller.
 */
export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || part,
        message: issue.message,
      }));
      return next(new ApiError(400, "Validation failed", errors));
    }

    // `query` and `params` are read-only getters on some Express versions,
    // so only body is reassigned.
    if (part === "body") {
      req.body = result.data;
    } else {
      Object.assign(req[part], result.data);
    }

    next();
  };
}
