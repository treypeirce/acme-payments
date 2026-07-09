import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";

const app = createApp();

async function getToken() {
  const res = await request(app)
    .post("/auth/token")
    .send({ customerId: "cus_123", apiKey: "sk_test_abcdefgh" });
  return res.body.accessToken as string;
}

describe("auth", () => {
  it("issues a bearer token", async () => {
    const res = await request(app)
      .post("/auth/token")
      .send({ customerId: "cus_123", apiKey: "sk_test_abcdefgh" });
    expect(res.status).toBe(200);
    expect(res.body.tokenType).toBe("Bearer");
    expect(res.body.accessToken).toBeTruthy();
  });

  it("rejects invalid credentials with a validation error", async () => {
    const res = await request(app).post("/auth/token").send({ customerId: "x" });
    expect(res.status).toBe(400);
  });

  it("rejects protected routes without a token", async () => {
    const res = await request(app).post("/orders").send({ amount: 100 });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("missing_bearer_token");
  });

  it("rejects a malformed token", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ amount: 100 });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_token");
  });

  it("accepts a valid token", async () => {
    const token = await getToken();
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 4200, currency: "USD" });
    expect(res.status).toBe(201);
  });

  it("rejects a token signed with a different HMAC algorithm (CVE-2022-23539)", async () => {
    const forged = jwt.sign(
      { sub: "cus_attacker", scope: "orders:write payments:write" },
      config.jwtSecret,
      { algorithm: "HS512", expiresIn: "30m", issuer: "acme-payments" },
    );

    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${forged}`)
      .send({ amount: 4200, currency: "USD" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("invalid_token");
  });
});
