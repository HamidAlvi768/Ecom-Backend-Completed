import jwt from "jsonwebtoken";

const JWT_SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

export const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET(), { expiresIn: "7d" });

// Frontends send:  authorization: bearer <token>
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ message: "Please add a token" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET());
    next();
  } catch {
    res.status(401).json({ message: "Token expired or invalid, please login again" });
  }
};
