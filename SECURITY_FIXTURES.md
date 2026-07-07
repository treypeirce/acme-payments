# Security Fixtures — Sentinel demo manifest

This repo intentionally pins three dependencies with known advisories. Each is
placed to exercise a **different branch** of the Sentinel triage pipeline:
`FIX`, `SKIP`, and `ESCALATE`. This file is the ground-truth answer key for the
demo — the triage engine should independently arrive at the same routing.

| # | Package | Pinned | Advisory (class) | Where it lives | Reachable? | Expected route |
|---|---------|--------|------------------|----------------|------------|----------------|
| 1 | `jsonwebtoken` | `8.5.1` | Algorithm-confusion / weak verify (fixed in `9.0.0`) | `src/middleware/auth.ts` → `jwt.verify()` | **Yes** — runs on every protected route | **FIX** |
| 2 | `marked` | `0.3.9` | ReDoS in markdown parsing (fixed in later majors) | *nowhere* — leftover from a removed receipt-notes feature | **No** — zero import sites | **SKIP** |
| 3 | `node-forge` | `1.0.0` | RSA PKCS#1 v1.5 signature-verification flaws (fixed in `1.3.0`) | `src/payments/tokenSigning.ts` → charge/refund | **Yes** — but on the settlement path | **ESCALATE** |

## Why each routes where it does

**#1 `jsonwebtoken` → FIX.** The vulnerable `jwt.verify(token, secret)` call in
`requireAuth` omits the `algorithms` option, exposing the classic
algorithm-confusion weakness. It is unambiguously reachable (it gates all
`/orders` and `/payments` traffic) and has a clean upstream fix. The remediation
is a genuine, small, defensible change: bump to `^9.0.0` **and** pass
`{ algorithms: ["HS256"] }` to `verify`. Ideal for an agent to reproduce with a
failing test, patch, and prove green.

**#2 `marked` → SKIP.** `marked@0.3.9` is declared in `package.json` but never
imported anywhere in `src/` — a dangling dependency left behind when a
"render receipt notes as markdown" feature was cut. The ReDoS can never trigger
because the vulnerable parser is not on any call path. Sentinel should render
this as **declined — present but unreachable**, with the evidence being *0 import
sites*. This is the demo's headline moment: the agent correctly **not acting**,
because an unnecessary patch is itself a new risk.

**#3 `node-forge` → ESCALATE.** This one is both reachable *and* patchable —
which is exactly the point. Because the affected code lives on the
money-movement / settlement path (`src/payments/**`), policy escalates it to a
human regardless of score. An agent does not get to silently modify the code
that signs payments; it assembles the case and hands it to change control.

## Reachability method (and its honest limits)

Reachability in the demo is a **module-level import-graph** check: is the
vulnerable package imported, and is that module transitively reachable from an
application entrypoint? This is deliberately simple and deterministic.

It **cannot** see reflection, dynamic `require`, or build-time injection — which
is precisely why `ESCALATE` exists and why anomalies without a clean verdict are
handed to a human rather than auto-fixed. (The xz-utils backdoor was caught by a
maintainer noticing sshd ran ~500ms slow, not by any scanner — absence of an
alert is not proof of safety.)

## Restoring / re-running

The fixtures are just pinned versions plus their usage (or deliberate non-usage).
To reset after a demo where an agent opened a fix PR, revert the PR branch. The
`FIX` target (`jsonwebtoken`) is the only one intended to actually be patched on
stage; `SKIP` and `ESCALATE` should remain untouched.
