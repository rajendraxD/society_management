import { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler.js";
import { UserRole } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; email: string };
    }
  }
}

/**
 * Verifies the `Authorization: Bearer <access-token>` header. Authorization is
 * always decided from the signed token, never from anything the client sends in
 * the body — a client-supplied role is not evidence of anything.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length).trim());
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    // Expired and forged tokens are deliberately indistinguishable to the client.
    next(new ApiError(401, "Session expired or invalid. Please sign in again."));
  }
}

/** Role gate. Runs after `requireAuth`; 403 when the token's role is not allowed. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have access to this resource"));
    }
    next();
  };
}
