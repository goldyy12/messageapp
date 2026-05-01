import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables");
    return res.status(500).json({ error: "Internal Server Error" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded as { userId: string; username?: string };
    next();
  });
};
