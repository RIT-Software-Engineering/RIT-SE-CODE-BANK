import jwt from "jsonwebtoken";

// Middleware to read cmt_id cookie and attach req.user
export default function authMiddleware(req, _res, next) {
  const cookieHeader = req.headers.cookie || "";
  let token = null;

  // Find cmt_id in the Cookie header
  cookieHeader.split(";").forEach((pair) => {
    const [name, value] = pair.trim().split("=");
    if (name === "cmt_id") {
      token = value;
    }
  });

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded; // { uid, email, name, ... } from dev-users.json
  } catch (err) {
    console.error("Failed to verify JWT:", err.message);
    req.user = null;
  }

  return next();
}
