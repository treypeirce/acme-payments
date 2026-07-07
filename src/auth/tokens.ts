/**
 * API session tokens. A caller exchanges credentials at POST /auth/token for a
 * short-lived bearer token that authorizes subsequent order and payment calls.
 */
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface SessionClaims {
  sub: string; // customerId
  scope: string;
}

export function issueSessionToken(customerId: string): string {
  const claims: SessionClaims = { sub: customerId, scope: "orders:write payments:write" };
  return jwt.sign(claims, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.tokenTtl,
    issuer: "acme-payments",
  });
}
