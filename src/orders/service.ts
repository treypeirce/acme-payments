import { store, type Order } from "../store.js";

export function createOrder(input: {
  customerId: string;
  amount: number;
  currency: string;
}): Order {
  return store.createOrder(input);
}

export function getOrder(id: string): Order | undefined {
  return store.getOrder(id);
}
