import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { hashPassword } from "../lib/password";
import { requireAuth } from "../middleware/auth";
import { validate, createUserSchema, updateUserSchema } from "../lib/validate";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/users/list — lightweight, any authenticated user
router.get("/users/list", requireAuth, async (_req, res) => {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .orderBy(users.name);
  return res.json({ users: rows });
});

// GET /api/users — full data, admin only
router.get("/users", requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const rows = await db.select().from(users);
  return res.json({ users: rows.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, departmentId: u.departmentId })) });
});

// POST /api/users
router.post("/users", requireAuth, validate(createUserSchema), async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, email, password, role, departmentId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });

  const pwHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ name, email, passwordHash: pwHash, role: role || "viewer", departmentId: departmentId || null }).returning();
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
});

// PUT /api/users/:id
router.put("/users/:id", requireAuth, validate(updateUserSchema), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, email, role, departmentId, password } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (departmentId !== undefined) updates.departmentId = departmentId;
  if (password) updates.passwordHash = await hashPassword(password);

  const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
});

// DELETE /api/users/:id
router.delete("/users/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  await db.delete(users).where(eq(users.id, id));
  return res.json({ ok: true });
});

export default router;
