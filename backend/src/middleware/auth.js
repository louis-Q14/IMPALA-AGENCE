const jwt = require("jsonwebtoken");
const db = require("../db");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token requis" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token invalide" });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    // super_admin bypasses all role checks — root access
    if (req.user.role === "super_admin") return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Accès réservé au super administrateur" });
  }
  next();
}

/**
 * Middleware: require an active subscription for the given service type.
 * Must be used AFTER authenticateToken.
 * Admins and super_admins bypass this check.
 */
function requireSubscription(serviceType) {
  return async (req, res, next) => {
    try {
      // Admins bypass the subscription check
      if (req.user.role === "super_admin" || req.user.role === "admin") return next();

      const result = await db.query(
        `SELECT 1 FROM user_services
         WHERE user_id = $1 AND service_type = $2 AND subscription_status = 'active'
         LIMIT 1`,
        [req.user.userId, serviceType]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: "Abonnement actif requis pour accéder à ce service",
          requires_subscription: true,
          service: serviceType,
        });
      }
      next();
    } catch (err) {
      console.error("requireSubscription error:", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  };
}

module.exports = { authenticateToken, requireRole, requireSuperAdmin, requireSubscription };
