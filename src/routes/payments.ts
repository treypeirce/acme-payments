import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { chargeOrder, refundPayment, PaymentError } from "../payments/service.js";

export const paymentsRouter = Router();

const chargeRequest = z.object({ orderId: z.string().min(3) });
const refundRequest = z.object({ paymentId: z.string().min(3) });

paymentsRouter.post("/payments/charge", requireAuth, (req, res, next) => {
  try {
    const { orderId } = chargeRequest.parse(req.body);
    const payment = chargeOrder(orderId);
    res.status(201).json(payment);
  } catch (err) {
    if (err instanceof PaymentError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

paymentsRouter.post("/payments/refund", requireAuth, (req, res, next) => {
  try {
    const { paymentId } = refundRequest.parse(req.body);
    const payment = refundPayment(paymentId);
    res.json(payment);
  } catch (err) {
    if (err instanceof PaymentError) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});
