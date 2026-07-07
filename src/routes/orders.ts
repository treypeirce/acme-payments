import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { createOrder, getOrder } from "../orders/service.js";

export const ordersRouter = Router();

const createOrderRequest = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
});

ordersRouter.post("/orders", requireAuth, (req, res, next) => {
  try {
    const body = createOrderRequest.parse(req.body);
    const order = createOrder({
      customerId: req.customerId!,
      amount: body.amount,
      currency: body.currency,
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/orders/:id", requireAuth, (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "order_not_found" });
  }
  res.json(order);
});
