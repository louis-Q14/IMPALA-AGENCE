const jwt = require("jsonwebtoken");

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

module.exports = { authenticateToken, requireRole, requireSuperAdmin };
