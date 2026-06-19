import { Router } from "express";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { users, knowledgeObjects } from "../db/schema";
import { hashPassword } from "../lib/password";
import { requireAuth } from "../middleware/auth";
import type { AuthRequest } from "../middleware/auth";

const router = Router();
const db = drizzle(process.env.DATABASE_URL!);

// GET /api/users
router.get("/users", requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const rows = await db.select().from(users);
  return res.json({ users: rows.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, departmentId: u.departmentId })) });
});

// POST /api/users
router.post("/users", requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, email, password, role, departmentId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });

  const pwHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ name, email, passwordHash: pwHash, role: role || "viewer", departmentId: departmentId || null }).returning();
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
});

// PUT /api/users/:id
router.put("/users/:id", requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  const { name, email, role, departmentId, password } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (departmentId !== undefined) updates.departmentId = departmentId;
  if (password) updates.passwordHash = await hashPassword(password);

  const [user] = await db.update(users).set(updates).where(eq(users.id, req.params.id as string)).returning();
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId } });
});

// DELETE /api/users/:id
router.delete("/users/:id", requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" });
  // 检查用户是否拥有知识对象
  const ownedObjects = await db
    .select({ id: knowledgeObjects.id })
    .from(knowledgeObjects)
    .where(eq(knowledgeObjects.ownerId, req.params.id as string))
    .limit(1);
  if (ownedObjects.length > 0) {
    return res.status(400).json({ error: "该用户仍有知识对象，无法删除" });
  }

  await db.delete(users).where(eq(users.id, req.params.id as string));
  return res.json({ ok: true });
});

export default router;
