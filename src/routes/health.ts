import { Router } from "express";
import { config } from "../config.js";

const startedAt = Date.now();
export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "acme-payments",
    version: config.version,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    time: new Date().toISOString(),
  });
});
