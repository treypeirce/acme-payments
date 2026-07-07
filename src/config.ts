/**
 * Runtime configuration for the Acme Payments API.
 * Values are sourced from the environment with safe local defaults.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
) as { version: string };

export const config = {
  port: Number(process.env.PORT ?? 8080),
  env: process.env.NODE_ENV ?? "development",
  version: pkg.version,
  /** HMAC secret for API session tokens. */
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me-in-production",
  /** Session tokens are short-lived. */
  tokenTtl: "30m",
} as const;
