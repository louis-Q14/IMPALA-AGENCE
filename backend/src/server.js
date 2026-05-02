require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const realEstateRoutes = require("./routes/realestate");
const autoRoutes = require("./routes/auto");
const trashRoutes = require("./routes/trash");
const subscriptionRoutes = require("./routes/subscriptions");
const adminRoutes = require("./routes/admin");
const superAdminRoutes = require("./routes/superadmin");
const financeRoutes = require("./routes/finance");
const depensesRoutes = require("./routes/depenses");
const tarifsfraisRoutes = require("./routes/tarifs-frais");
const messagesRoutes = require("./routes/messages");
const servicesRoutes = require("./routes/services");
const { auditActions } = require("./middleware/auditActions");
const { ensureAuditFile } = require("./services/actionAudit");
const { ensureFolderSchema } = require("./db/ensureFolderSchema");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing (raw for Stripe webhooks)
app.use("/api/subscriptions/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
ensureAuditFile();
app.use(auditActions);

// Serve uploaded files (user documents)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/real-estate", realEstateRoutes);
app.use("/api/auto", autoRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/depenses", depensesRoutes);
app.use("/api/tarifs-frais", tarifsfraisRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/services", servicesRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur serveur interne" });
});

async function startServer() {
  try {
    await ensureFolderSchema();
    app.listen(PORT, () => {
      console.log(`IMPALA-AGENCE API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database folder schema initialization failed:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

