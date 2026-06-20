import { describe, it, expect, vi } from "vitest";

// ── Mock drizzle-orm/node-postgres ──
const mockDb = vi.hoisted(() => {
  const createChain = (result: any) => {
    const chain: any = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      leftJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve(result)),
      returning: vi.fn(() => Promise.resolve(result)),
      values: vi.fn(() => chain),
      set: vi.fn(() => chain),
    };
    return chain;
  };

  const db: any = {
    select: vi.fn(() => createChain([])),
    insert: vi.fn(() => createChain([])),
    delete: vi.fn(() => createChain([])),
    update: vi.fn(() => createChain([])),
  };

  return db;
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: any, b: any) => ({ type: "eq", a, b })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  gt: vi.fn((a: any, b: any) => ({ type: "gt", a, b })),
}));

vi.mock("../db/schema", () => ({
  sessions: { _tableName: "sessions" },
  users: { _tableName: "users" },
}));

// ── 导入被测模块 ──
import { loadAuth, requireAuth, type AuthRequest } from "../middleware/auth";

// ============================================================================
// requireAuth
// ============================================================================

describe("auth middleware: requireAuth", () => {
  it("user 存在时调用 next()", () => {
    const req = { user: { id: "u1", name: "Test", email: "t@x.com", role: "viewer", departmentId: null } } as unknown as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("user 不存在时返回 401", () => {
    const req = { user: undefined } as unknown as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================================
// loadAuth
// ============================================================================

describe("auth middleware: loadAuth", () => {
  it("无 session cookie 时直接 next()，user 为 undefined", async () => {
    const req = { cookies: {} } as unknown as AuthRequest;
    const _res = {} as any;
    const next = vi.fn();

    await loadAuth(req, _res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("无 cookies 对象时直接 next()", async () => {
    const req = {} as unknown as AuthRequest;
    const _res = {} as any;
    const next = vi.fn();

    await loadAuth(req, _res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("session cookie 存在但 DB 无匹配时，静默通过", async () => {
    // 默认 mockDb.select 返回空数组
    const req = {
      cookies: { kp_sid: "invalid-session-id" },
    } as unknown as AuthRequest;
    const _res = {} as any;
    const next = vi.fn();

    await loadAuth(req, _res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("有效 session 时附加 user 到 req", async () => {
    // 设置 select 返回有效用户
    const userData = {
      userId: "u1",
      name: "张三",
      email: "zs@x.com",
      role: "editor",
      departmentId: "d1",
    };

    const chain: any = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve([userData])),
    };
    mockDb.select.mockReturnValue(chain);

    const req = {
      cookies: { kp_sid: "valid-session-id" },
    } as unknown as AuthRequest;
    const _res = {} as any;
    const next = vi.fn();

    await loadAuth(req, _res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: "u1",
      name: "张三",
      email: "zs@x.com",
      role: "editor",
      departmentId: "d1",
    });
  });

  it("DB 查询异常时静默失败，继续未认证状态", async () => {
    const chain: any = {
      from: vi.fn(() => chain),
      innerJoin: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(() => Promise.reject(new Error("DB connection error"))),
    };
    mockDb.select.mockReturnValue(chain);

    const req = {
      cookies: { kp_sid: "some-session" },
    } as unknown as AuthRequest;
    const _res = {} as any;
    const next = vi.fn();

    await loadAuth(req, _res, next);

    // 不应抛异常，应静默通过
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
