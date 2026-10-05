import { ApiError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/tokens.js";
/**
 * Verifies the `Authorization: Bearer <access-token>` header. Authorization is
 * always decided from the signed token, never from anything the client sends in
 * the body — a client-supplied role is not evidence of anything.
 */
export function requireAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(new ApiError(401, "Authentication required"));
    }
    try {
        const payload = verifyAccessToken(header.slice("Bearer ".length).trim());
        req.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email,
            flatNumber: payload.flatNumber,
        };
        next();
    }
    catch {
        // Expired and forged tokens are deliberately indistinguishable to the client.
        next(new ApiError(401, "Session expired or invalid. Please sign in again."));
    }
}
/** Role gate. Runs after `requireAuth`; 403 when the token's role is not allowed. */
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Authentication required"));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }
        next();
    };
}
