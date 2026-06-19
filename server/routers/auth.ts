import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, sessions } from "../db/schema";
import { verifyPassword } from "../lib/password";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";
import { buildLoginUrl, handleCallback } from "../lib/oidc";

// 内存 store，存 OIDC 临时参数（生产环境应换 Redis）
const oidcStore = new Map<string, { codeVerifier: string; nonce: string; state: string }>();

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

    if (!user.passwordHash) return res.status(401).json({ error: '此账号使用统一认证登录' });
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

// GET /api/auth/login — OIDC: redirect to MaxKey
router.get("/auth/login", async (_req, res) => {
  try {
    const { url, codeVerifier, state, nonce } = await buildLoginUrl();
    oidcStore.set(state, { codeVerifier, nonce, state });
    return res.redirect(url);
  } catch (err) {
    console.error("OIDC login error:", err);
    return res.status(500).json({ error: "认证服务暂不可用" });
  }
});

// GET /api/auth/callback — OIDC: handle MaxKey redirect
router.get("/auth/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const stored = oidcStore.get(state);
    if (!stored) return res.status(400).json({ error: "认证会话已过期，请重新登录" });
    oidcStore.delete(state);

    const oidcUser = await handleCallback(code, stored.codeVerifier, stored.nonce);

    let [user] = await db.select().from(users).where(eq(users.externalId, oidcUser.externalId)).limit(1);

    if (!user) {
      [user] = await db.insert(users).values({
        name: oidcUser.name,
        email: oidcUser.email || `${oidcUser.externalId}@placeholder.local`,
        externalId: oidcUser.externalId,
        role: "viewer",
      }).returning();
    } else {
      await db.update(users).set({ name: oidcUser.name, email: oidcUser.email || user.email }).where(eq(users.id, user.id));
    }

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
    const [session] = await db.insert(sessions).values({ userId: user.id, expiresAt }).returning();

    res.cookie(SESSION_COOKIE, session.id, {
      httpOnly: true, secure: false, sameSite: "lax", maxAge: SESSION_MAX_AGE_MS, path: "/",
    });

    return res.redirect("/");
  } catch (err) {
    console.error("OIDC callback error:", err);
    return res.status(500).json({ error: "认证失败，请重试" });
  }
});

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
