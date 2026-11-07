import jwt from "jsonwebtoken";
import User from "../models/Users.mjs";

const JWT_SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

export const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET(), { expiresIn: "7d" });

// Any logged-in user. Frontends send:  authorization: bearer <token>
// Loads the user from the database, so deleted accounts and role changes apply at once.
export const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ message: "Please log in" });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET());
  } catch {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
  try {
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "Account no longer exists" });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin dashboard only. Use after verifyToken.
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

export const adminOnly = [verifyToken, requireAdmin];
