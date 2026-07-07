import { store, type Payment } from "../store.js";
import {
  canonicalize,
  signPaymentAuthorization,
  verifyPaymentAuthorization,
} from "./tokenSigning.js";

export function chargeOrder(orderId: string): Payment {
  const order = store.getOrder(orderId);
  if (!order) {
    throw new PaymentError("order_not_found", 404);
  }
  if (order.status === "refunded") {
    throw new PaymentError("order_refunded", 409);
  }

  // Create the payment first, then bind an authorization token to its real id.
  const payment = store.createPayment({
    orderId: order.id,
    amount: order.amount,
    status: "authorized",
    authorizationToken: "",
  });
  const canonical = canonicalize({
    paymentId: payment.id,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  });
  payment.authorizationToken = signPaymentAuthorization(canonical);
  store.savePayment(payment);

  order.status = "authorized";
  store.saveOrder(order);
  return payment;
}

export function refundPayment(paymentId: string): Payment {
  const payment = store.getPayment(paymentId);
  if (!payment) {
    throw new PaymentError("payment_not_found", 404);
  }

  // Re-verify the authorization token before reversing funds.
  const order = store.getOrder(payment.orderId);
  const canonical = canonicalize({
    paymentId: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: order?.currency ?? "USD",
  });
  if (!verifyPaymentAuthorization(canonical, payment.authorizationToken)) {
    throw new PaymentError("authorization_verification_failed", 422);
  }

  payment.status = "refunded";
  store.savePayment(payment);
  if (order) {
    order.status = "refunded";
    store.saveOrder(order);
  }
  return payment;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}
