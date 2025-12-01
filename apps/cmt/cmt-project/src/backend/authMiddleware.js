// src/backend/authMiddleware.js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const jwtCookie = cookies.find((c) => c.startsWith("cmt_id="));

  if (!jwtCookie) {
    req.user = null;
    return next();
  }

  const token = jwtCookie.split("=")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded; // { email, name, uid, roles, ... }
  } catch (err) {
    console.error("Failed to verify JWT:", err.message);
    req.user = null;
  }

  next();
}

module.exports = authMiddleware;
