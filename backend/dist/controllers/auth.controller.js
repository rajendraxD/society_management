"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const store_js_1 = require("../services/store.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const password_js_1 = require("../utils/password.js");
const tokens_js_1 = require("../utils/tokens.js");
const isProd = () => process.env.NODE_ENV === "production";
/**
 * Refresh token lives in an httpOnly cookie so JavaScript — and therefore any
 * XSS payload — cannot read it. `Secure` is only set in production: over a
 * plain-HTTP dev/LAN origin the browser would refuse to store the cookie at all.
 */
const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: isProd(),
    sameSite: (isProd() ? "none" : "lax"),
    path: "/api/auth",
    maxAge: (0, tokens_js_1.refreshCookieMaxAge)(),
});
/** Strips fields the client never needs, notably the password hash. */
function toPublicUser(user) {
    const { passwordHash, refreshTokenVersion, ...rest } = user;
    void passwordHash;
    void refreshTokenVersion;
    return rest;
}
function issueTokens(user) {
    const id = String(user._id);
    return {
        accessToken: (0, tokens_js_1.signAccessToken)({ sub: id, role: user.role, email: user.email }),
        refreshToken: (0, tokens_js_1.signRefreshToken)({
            sub: id,
            ver: user.refreshTokenVersion ?? 0,
        }),
    };
}
exports.AuthController = {
    /**
     * Password sign-in. The email identifies the account and the role stored on
     * it decides what the token grants — the role posted by the client is only
     * used to catch a mismatched login screen, never to authorise anything.
     */
    login: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const { email, password, role } = req.body;
        const user = await store_js_1.Store.getUserByEmailWithHash(email);
        // One generic message for "no such user" and "wrong password" so the
        // endpoint cannot be used to enumerate registered emails.
        if (!user || !user.isActive) {
            throw new errorHandler_js_1.ApiError(401, "Invalid email or password");
        }
        const passwordOk = await (0, password_js_1.verifyPassword)(password, user.passwordHash);
        if (!passwordOk) {
            throw new errorHandler_js_1.ApiError(401, "Invalid email or password");
        }
        if (role && role !== user.role) {
            throw new errorHandler_js_1.ApiError(403, `These credentials belong to a ${user.role} account. Switch to the ${user.role} login.`);
        }
        const { accessToken, refreshToken } = issueTokens(user);
        res.cookie(tokens_js_1.REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
        res.json({
            success: true,
            message: "Authentication successful",
            data: { user: toPublicUser(user), accessToken },
        });
    }),
    /** Exchanges the refresh cookie for a fresh access token. */
    refresh: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const token = req.cookies?.[tokens_js_1.REFRESH_COOKIE_NAME];
        if (!token) {
            throw new errorHandler_js_1.ApiError(401, "No active session");
        }
        let payload;
        try {
            payload = (0, tokens_js_1.verifyRefreshToken)(token);
        }
        catch {
            throw new errorHandler_js_1.ApiError(401, "Session expired. Please sign in again.");
        }
        const user = await store_js_1.Store.getUserById(payload.sub);
        if (!user || !user.isActive) {
            throw new errorHandler_js_1.ApiError(401, "Account is no longer active");
        }
        // A version mismatch means this token was revoked by a logout.
        if (user.refreshTokenVersion !== payload.ver) {
            throw new errorHandler_js_1.ApiError(401, "Session expired. Please sign in again.");
        }
        const tokens = issueTokens({
            _id: payload.sub,
            role: user.role,
            email: user.email,
            refreshTokenVersion: payload.ver,
        });
        res.cookie(tokens_js_1.REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
        res.json({
            success: true,
            message: "Session refreshed",
            data: { user: toPublicUser(user), accessToken: tokens.accessToken },
        });
    }),
    /** Revokes every refresh token for the caller and clears the cookie. */
    logout: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        if (req.user) {
            await store_js_1.Store.bumpRefreshTokenVersion(req.user.id);
        }
        res.clearCookie(tokens_js_1.REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
        res.json({ success: true, message: "Signed out successfully", data: {} });
    }),
    /** Profile of the token holder — used to rehydrate the client after reload. */
    me: (0, errorHandler_js_1.asyncHandler)(async (req, res) => {
        const user = await store_js_1.Store.getUserById(req.user.id);
        if (!user) {
            throw new errorHandler_js_1.ApiError(404, "User not found");
        }
        res.json({
            success: true,
            message: "Profile fetched successfully",
            data: { user },
        });
    }),
    getRoles: (0, errorHandler_js_1.asyncHandler)(async (_req, res) => {
        const users = await store_js_1.Store.getUsers();
        res.json({
            success: true,
            message: "Roles fetched successfully",
            data: {
                roles: users.map((u) => ({
                    id: u.role,
                    name: u.title,
                    badgeLine: u.badgeLine,
                })),
                users,
            },
        });
    }),
};
