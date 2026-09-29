import jwt from "jsonwebtoken";
import { UserRole } from "../models/User.js";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  sub: string;
  ver: number;
}

const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

/**
 * Read a signing secret, refusing to start in production without one. A silent
 * fallback secret is the classic JWT footgun: everything "works" until someone
 * forges a token. Dev gets a fixed local default so the demo runs out of the box.
 */
function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `${name} must be set in production. Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }
  return devFallback;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, secret("JWT_ACCESS_SECRET", "dev-access-secret"), {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, secret("JWT_REFRESH_SECRET", "dev-refresh-secret"), {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    secret("JWT_ACCESS_SECRET", "dev-access-secret")
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    secret("JWT_REFRESH_SECRET", "dev-refresh-secret")
  ) as RefreshTokenPayload;
}

/** Refresh-cookie lifetime in ms, derived from the same config as the token. */
export function refreshCookieMaxAge(): number {
  const days = /^(\d+)d$/.exec(REFRESH_EXPIRES);
  if (days) return Number(days[1]) * 24 * 60 * 60 * 1000;

  const hours = /^(\d+)h$/.exec(REFRESH_EXPIRES);
  if (hours) return Number(hours[1]) * 60 * 60 * 1000;

  return 7 * 24 * 60 * 60 * 1000;
}

export const REFRESH_COOKIE_NAME = "society_refresh_token";
