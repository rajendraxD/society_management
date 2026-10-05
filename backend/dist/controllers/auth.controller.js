import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { verifyPassword } from "../utils/password.js";
import { REFRESH_COOKIE_NAME, refreshCookieMaxAge, signAccessToken, signRefreshToken, verifyRefreshToken, } from "../utils/tokens.js";
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
    maxAge: refreshCookieMaxAge(),
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
        accessToken: signAccessToken({
            sub: id,
            role: user.role,
            email: user.email,
            flatNumber: user.flatNumber,
        }),
        refreshToken: signRefreshToken({
            sub: id,
            ver: user.refreshTokenVersion ?? 0,
        }),
    };
}
export const AuthController = {
    /**
     * Password sign-in. The email identifies the account and the role stored on
     * it decides what the token grants — the role posted by the client is only
     * used to catch a mismatched login screen, never to authorise anything.
     */
    login: asyncHandler(async (req, res) => {
        const { email, password, role } = req.body;
        const user = await Store.getUserByEmailWithHash(email);
        // One generic message for "no such user" and "wrong password" so the
        // endpoint cannot be used to enumerate registered emails.
        if (!user || !user.isActive) {
            throw new ApiError(401, "Invalid email or password");
        }
        const passwordOk = await verifyPassword(password, user.passwordHash);
        if (!passwordOk) {
            throw new ApiError(401, "Invalid email or password");
        }
        if (role && role !== user.role) {
            throw new ApiError(403, `These credentials belong to a ${user.role} account. Switch to the ${user.role} login.`);
        }
        const { accessToken, refreshToken } = issueTokens({
            _id: user._id,
            role: user.role,
            email: user.email,
            flatNumber: user.flatNumber,
            refreshTokenVersion: user
                .refreshTokenVersion,
        });
        res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
        res.json({
            success: true,
            message: "Authentication successful",
            data: { user: toPublicUser(user), accessToken },
        });
    }),
    /** Exchanges the refresh cookie for a fresh access token. */
    refresh: asyncHandler(async (req, res) => {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) {
            throw new ApiError(401, "No active session");
        }
        let payload;
        try {
            payload = verifyRefreshToken(token);
        }
        catch {
            throw new ApiError(401, "Session expired. Please sign in again.");
        }
        const user = await Store.getUserById(payload.sub);
        if (!user || !user.isActive) {
            throw new ApiError(401, "Account is no longer active");
        }
        // A version mismatch means this token was revoked by a logout.
        if (user.refreshTokenVersion !== payload.ver) {
            throw new ApiError(401, "Session expired. Please sign in again.");
        }
        const tokens = issueTokens({
            _id: payload.sub,
            role: user.role,
            email: user.email,
            flatNumber: user.flatNumber,
            refreshTokenVersion: payload.ver,
        });
        res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
        res.json({
            success: true,
            message: "Session refreshed",
            data: { user: toPublicUser(user), accessToken: tokens.accessToken },
        });
    }),
    /** Revokes every refresh token for the caller and clears the cookie. */
    logout: asyncHandler(async (req, res) => {
        if (req.user) {
            await Store.bumpRefreshTokenVersion(req.user.id);
        }
        res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: 0 });
        res.json({ success: true, message: "Signed out successfully", data: {} });
    }),
    /** Profile of the token holder — used to rehydrate the client after reload. */
    me: asyncHandler(async (req, res) => {
        const user = await Store.getUserById(req.user.id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        res.json({
            success: true,
            message: "Profile fetched successfully",
            data: { user },
        });
    }),
    /**
     * Role metadata for the role-select screen. Unauthenticated by necessity —
     * nobody has signed in yet — so it returns role labels only. User records
     * (name, email, phone, Aadhaar digits) must never be added here: this route
     * has no auth and is therefore public.
     */
    getRoles: asyncHandler(async (_req, res) => {
        const users = await Store.getUsers();
        res.json({
            success: true,
            message: "Roles fetched successfully",
            data: {
                roles: users.map((u) => ({
                    id: u.role,
                    name: u.title,
                    badgeLine: u.badgeLine,
                })),
            },
        });
    }),
};
