import { Request, Response, NextFunction } from "express";

/**
 * Middleware to check if a user is authenticated and has admin privileges
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if user has admin role
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  // User is authenticated and has admin role
  next();
}