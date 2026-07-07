/**
 * In-memory data store. Stands in for Postgres in this reference service so
 * the API runs with zero external dependencies. State resets on restart.
 */
import { randomUUID } from "node:crypto";

export interface Order {
  id: string;
  customerId: string;
  currency: string;
  amount: number; // minor units (cents)
  status: "created" | "authorized" | "refunded";
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: "authorized" | "refunded";
  authorizationToken: string;
  createdAt: string;
}

const orders = new Map<string, Order>();
const payments = new Map<string, Payment>();

export const store = {
  createOrder(input: Omit<Order, "id" | "status" | "createdAt">): Order {
    const order: Order = {
      id: `ord_${randomUUID().slice(0, 12)}`,
      status: "created",
      createdAt: new Date().toISOString(),
      ...input,
    };
    orders.set(order.id, order);
    return order;
  },
  getOrder(id: string): Order | undefined {
    return orders.get(id);
  },
  saveOrder(order: Order): void {
    orders.set(order.id, order);
  },
  createPayment(input: Omit<Payment, "id" | "createdAt">): Payment {
    const payment: Payment = {
      id: `pay_${randomUUID().slice(0, 12)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    payments.set(payment.id, payment);
    return payment;
  },
  getPayment(id: string): Payment | undefined {
    return payments.get(id);
  },
  savePayment(payment: Payment): void {
    payments.set(payment.id, payment);
  },
};
