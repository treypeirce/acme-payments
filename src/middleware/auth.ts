/**
 * Bearer-token authentication guard applied to every state-changing route.
 *
 * Reads the Authorization header, verifies the session token, and attaches the
 * resolved customer to the request. This runs on the hot path for all
 * /orders and /payments traffic.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { SessionClaims } from "../auth/tokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customerId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing_bearer_token" });
  }

  try {
    // Verify the caller's session token against the shared HMAC secret.
    const claims = jwt.verify(token, config.jwtSecret) as SessionClaims;
    req.customerId = claims.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
