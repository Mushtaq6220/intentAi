import app from "./src/app.js";
import { config } from "./src/config/env.js";

const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`CARDANO AI INTENT TRANSACTION ENGINE IS RUNNING!`);
  console.log(`PORT: http://localhost:${PORT}`);
  console.log(`Preprod Testnet Mode: Enabled`);
  console.log("==================================================");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down server gracefully.");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
