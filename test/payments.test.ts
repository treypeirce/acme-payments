import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { warmSigningKey } from "../src/payments/tokenSigning.js";

const app = createApp();
let token: string;

beforeAll(async () => {
  // Generating the RSA signing key can take a moment; warm it before tests.
  warmSigningKey();
  const res = await request(app)
    .post("/auth/token")
    .send({ customerId: "cus_pay", apiKey: "sk_test_abcdefgh" });
  token = res.body.accessToken;
}, 20000);

async function newOrder(amount = 5000) {
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${token}`)
    .send({ amount, currency: "USD" });
  return res.body.id as string;
}

describe("payments", () => {
  it("charges an order and returns a signed authorization token", async () => {
    const orderId = await newOrder(7500);
    const res = await request(app)
      .post("/payments/charge")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("authorized");
    expect(res.body.authorizationToken).toBeTruthy();
  });

  it("refunds an authorized payment after verifying its signature", async () => {
    const orderId = await newOrder(3300);
    const charge = await request(app)
      .post("/payments/charge")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId });
    const refund = await request(app)
      .post("/payments/refund")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentId: charge.body.id });
    expect(refund.status).toBe(200);
    expect(refund.body.status).toBe("refunded");
  });

  it("rejects charging an unknown order", async () => {
    const res = await request(app)
      .post("/payments/charge")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: "ord_nope" });
    expect(res.status).toBe(404);
  });
});
