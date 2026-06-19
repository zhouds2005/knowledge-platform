import type { Request, Response, NextFunction } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gt } from "drizzle-orm";
import { sessions, users } from "../db/schema";

const db = drizzle(process.env.DATABASE_URL!);

/** Extend Express Request to include authenticated user */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
  };
}

const SESSION_COOKIE = "kp_sid";

/**
 * Express middleware: checks session cookie, looks up user, attaches to req.
 * Does NOT reject unauthenticated requests — use `requireAuth` for that.
 */
export async function loadAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const sid = req.cookies?.[SESSION_COOKIE];
    if (!sid) return next();

    const [session] = await db
      .select({
        userId: sessions.userId,
        name: users.name,
        email: users.email,
        role: users.role,
        departmentId: users.departmentId,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(eq(sessions.id, sid), gt(sessions.expiresAt, new Date())),
      )
      .limit(1);

    if (session) {
      req.user = {
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        departmentId: session.departmentId,
      };
    }
  } catch {
    // Session lookup failed silently — request continues unauthenticated
  }

  next();
}

/**
 * Middleware: rejects requests without a valid session.
 */
export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
