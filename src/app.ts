import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { ordersRouter } from "./routes/orders.js";
import { paymentsRouter } from "./routes/payments.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("tiny"));
  }

  // Static status console at /
  app.use(express.static(join(__dirname, "..", "public")));

  // API surface
  app.use(healthRouter);
  app.use(authRouter);
  app.use(ordersRouter);
  app.use(paymentsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
