import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import intentRoutes from "./routes/intentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import txHistoryRoutes from "./routes/txHistoryRoutes.js";

const app = express();

// Standard express protection and logs
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading fonts/images locally in dev
}));
app.use(morgan("dev"));

// Allow requests from React/Next.js frontend
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Wallet-Address", "X-Blockchain", "X-Cardano-Network"],
  credentials: true
}));

app.use(express.json());

// Routes Namespace Mapping
app.use("/api/intent", intentRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/txhistory", txHistoryRoutes);

// Root endpoint for browser testing
app.get("/", (req, res) => {
  res.status(200).send("<h1>Cardano AI Intent Backend is Running</h1><p>API endpoints are available under /api/intent, /api/contacts, and /api/transaction</p>");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date(),
    service: "Cardano AI Intent Parser API"
  });
});

// Error handling fallback
app.use((err, req, res, next) => {
  console.error("Unhandled Error Boundary Caught:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message
  });
});

export default app;
