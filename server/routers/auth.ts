import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, sessions } from "../db/schema";
import { verifyPassword } from "../lib/password";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

const SESSION_COOKIE = "kp_sid";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create session
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
    const [session] = await db
      .insert(sessions)
      .values({ userId: user.id, expiresAt })
      .returning();

    res.cookie(SESSION_COOKIE, session.id, {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
      path: "/",
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (req, res) => {
  const sid = req.cookies?.[SESSION_COOKIE];
  if (sid) {
    await db.delete(sessions).where(eq(sessions.id, sid));
  }

  res.clearCookie(SESSION_COOKIE, { path: "/" });
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, (req: AuthRequest, res) => {
  return res.json({ user: req.user });
});

export default router;
