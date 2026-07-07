#!/usr/bin/env node
/**
 * Starter guardrail for coding agents operating in this repo.
 * Reads a hook payload as JSON on stdin and denies dangerous shell commands.
 *
 * This is intentionally minimal — the Sentinel demo (Phase 4) hardens and
 * extends these rules. Verify the exact Cursor hooks schema against
 * https://cursor.com/docs/hooks before relying on it in production.
 */
import { readFileSync } from "node:fs";

const DANGEROUS = [
  { re: /curl[^\n|]*\|\s*(sh|bash)/i, why: "piping a remote script straight into a shell" },
  { re: /wget[^\n|]*\|\s*(sh|bash)/i, why: "piping a remote script straight into a shell" },
  { re: /rm\s+-rf\s+(\/|~|\$HOME)/i, why: "recursive delete outside the workspace" },
  { re: /git\s+push[^\n]*--force/i, why: "force-push" },
  { re: /npm\s+publish/i, why: "publishing a package" },
  { re: /\.github\/workflows/i, why: "modifying CI workflow files" },
];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function extractCommand(payload) {
  if (!payload || typeof payload !== "object") return "";
  return (
    payload.command ??
    payload.args?.command ??
    payload.tool_input?.command ??
    payload.input?.command ??
    ""
  );
}

const raw = readStdin();
let payload = {};
try {
  payload = JSON.parse(raw || "{}");
} catch {
  payload = {};
}

const command = String(extractCommand(payload));
const hit = DANGEROUS.find((d) => d.re.test(command));

if (hit) {
  process.stdout.write(
    JSON.stringify({
      permission: "deny",
      agentMessage: `Blocked by Acme change-control guardrail: ${hit.why}. Rewrite the step to comply with policy.`,
    }),
  );
} else {
  process.stdout.write(JSON.stringify({ permission: "allow" }));
}
