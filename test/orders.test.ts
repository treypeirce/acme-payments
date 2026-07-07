import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();
let token: string;

beforeAll(async () => {
  const res = await request(app)
    .post("/auth/token")
    .send({ customerId: "cus_orders", apiKey: "sk_test_abcdefgh" });
  token = res.body.accessToken;
});

describe("orders", () => {
  it("creates and fetches an order", async () => {
    const created = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 9900, currency: "USD" });
    expect(created.status).toBe(201);
    expect(created.body.id).toMatch(/^ord_/);
    expect(created.body.status).toBe("created");

    const fetched = await request(app)
      .get(`/orders/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.amount).toBe(9900);
  });

  it("rejects invalid order amounts", async () => {
    const res = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -5 });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown orders", async () => {
    const res = await request(app)
      .get("/orders/ord_does_not_exist")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
