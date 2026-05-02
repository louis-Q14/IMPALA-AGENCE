const jwt = require("jsonwebtoken");
const { addEntry } = require("../services/actionAudit");

const TRACKED_ROLES = new Set(["admin", "support_agent", "finance_agent"]);
const REDACT_KEYS = new Set([
  "password",
  "password_hash",
  "token",
  "access_token",
  "authorization",
  "refresh_token",
]);

function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (!value || typeof value !== "object") return value;

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (REDACT_KEYS.has(String(key).toLowerCase())) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = scrub(item);
    }
  }
  return out;
}

function actionLabel(req) {
  const cleanUrl = (req.originalUrl || "").split("?")[0];
  const entity = cleanUrl.split("/").filter(Boolean).slice(1).join("/") || "resource";
  return `${req.method} ${entity}`;
}

function shouldSkip(req) {
  if (req.method === "OPTIONS") return true;
  if (!req.path.startsWith("/api/")) return true;
  if (req.path.startsWith("/api/health")) return true;
  if (req.path.startsWith("/api/superadmin/audit")) return true;
  return false;
}

function auditActions(req, res, next) {
  if (shouldSkip(req)) return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();

  jwt.verify(token, process.env.JWT_SECRET, (err, actor) => {
    if (err || !actor || !TRACKED_ROLES.has(actor.role)) return next();

    const startedAt = Date.now();
    let responseBody = null;

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      responseBody = payload;
      return originalJson(payload);
    };

    res.on("finish", () => {
      addEntry({
        actor: {
          userId: actor.userId,
          email: actor.email,
          role: actor.role,
          full_name: actor.full_name,
        },
        action: actionLabel(req),
        details: `Action capturée automatiquement (${Date.now() - startedAt} ms)`,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        requestBody: scrub(req.body || {}),
        responseBody: scrub(responseBody || {}),
      });
    });

    next();
  });
}

module.exports = { auditActions };
