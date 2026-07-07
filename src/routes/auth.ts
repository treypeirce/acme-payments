import { Router } from "express";
import { z } from "zod";
import { issueSessionToken } from "../auth/tokens.js";

export const authRouter = Router();

const tokenRequest = z.object({
  customerId: z.string().min(3),
  apiKey: z.string().min(8),
});

/**
 * Exchange an API key for a short-lived session token.
 * (Demo credential check — real deployments delegate to the identity provider.)
 */
authRouter.post("/auth/token", (req, res, next) => {
  try {
    const { customerId } = tokenRequest.parse(req.body);
    const token = issueSessionToken(customerId);
    res.json({ tokenType: "Bearer", accessToken: token, expiresIn: 1800 });
  } catch (err) {
    next(err);
  }
});
