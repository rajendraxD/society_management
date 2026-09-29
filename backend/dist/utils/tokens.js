"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE_NAME = void 0;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.refreshCookieMaxAge = refreshCookieMaxAge;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";
/**
 * Read a signing secret, refusing to start in production without one. A silent
 * fallback secret is the classic JWT footgun: everything "works" until someone
 * forges a token. Dev gets a fixed local default so the demo runs out of the box.
 */
function secret(name, devFallback) {
    const value = process.env[name];
    if (value)
        return value;
    if (process.env.NODE_ENV === "production") {
        throw new Error(`${name} must be set in production. Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`);
    }
    return devFallback;
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, secret("JWT_ACCESS_SECRET", "dev-access-secret"), {
        expiresIn: ACCESS_EXPIRES,
    });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, secret("JWT_REFRESH_SECRET", "dev-refresh-secret"), {
        expiresIn: REFRESH_EXPIRES,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, secret("JWT_ACCESS_SECRET", "dev-access-secret"));
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, secret("JWT_REFRESH_SECRET", "dev-refresh-secret"));
}
/** Refresh-cookie lifetime in ms, derived from the same config as the token. */
function refreshCookieMaxAge() {
    const days = /^(\d+)d$/.exec(REFRESH_EXPIRES);
    if (days)
        return Number(days[1]) * 24 * 60 * 60 * 1000;
    const hours = /^(\d+)h$/.exec(REFRESH_EXPIRES);
    if (hours)
        return Number(hours[1]) * 60 * 60 * 1000;
    return 7 * 24 * 60 * 60 * 1000;
}
exports.REFRESH_COOKIE_NAME = "society_refresh_token";
