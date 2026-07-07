import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { warmSigningKey } from "./payments/tokenSigning.js";

const app = createApp();

// Warm the payment signing key so the first charge isn't slow.
warmSigningKey();

app.listen(config.port, () => {
  logger.info("acme-payments listening", {
    port: config.port,
    version: config.version,
    env: config.env,
  });
});
