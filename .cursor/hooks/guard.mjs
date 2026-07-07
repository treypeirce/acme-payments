#!/usr/bin/env node
/**
 * Change-control guardrail for coding agents operating in this repo.
 * Registered as a `beforeShellExecution` hook in .cursor/hooks.json, so it runs
 * before ANY shell command an agent tries — and can DENY it. This is
 * enforcement, not advice: unlike a rule the model can rationalize past, a
 * denied hook stops the command outright.
 *
 * Reads the hook payload as JSON on stdin, returns {permission, agentMessage}.
 */
import { readFileSync } from "node:fs";

const DANGEROUS = [
  { re: /(curl|wget)\b[^\n|]*\|\s*(sh|bash|zsh)/i, why: "piping a remote script straight into a shell" },
  { re: /\brm\s+-rf?\s+(\/|~|\$HOME|\.\.)/i, why: "recursive delete outside the workspace" },
  { re: /\bgit\s+push\b[^\n]*(--force|-f)\b/i, why: "force-push (rewrites shared history)" },
  { re: /\b(npm|yarn|pnpm)\s+publish\b/i, why: "publishing a package" },
  { re: /\.github\/workflows\//i, why: "modifying CI/CD workflow files" },
  { re: /\bchmod\s+777\b/i, why: "granting world-writable permissions" },
  { re: /\bsudo\b/i, why: "privilege escalation" },
  { re: /\bbase64\s+-d[^\n|]*\|\s*(sh|bash)/i, why: "decoding and executing an opaque payload" },
  { re: /\b(cat|printenv|env)\b[^\n]*\.env\b/i, why: "reading secrets from .env" },
];

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}
function extractCommand(p) {
  if (!p || typeof p !== "object") return "";
  return p.command ?? p.args?.command ?? p.tool_input?.command ?? p.input?.command ?? "";
}

let payload = {};
try {
  payload = JSON.parse(readStdin() || "{}");
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
