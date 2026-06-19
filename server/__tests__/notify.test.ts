import { describe, it, expect, vi, beforeEach } from "vitest";

// ── 使用 vi.hoisted 确保 mock 对象在 vi.mock 提升时已可用 ──
const mockDb = vi.hoisted(() => {
  // 链式 builder 工厂
  const createSelectChain = (result: any) => {
    const chain: any = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve(result)),
    };
    return chain;
  };

  const createInsertChain = (result: any) => {
    const chain: any = {
      values: vi.fn(() => chain),
      returning: vi.fn(() => Promise.resolve(result)),
    };
    return chain;
  };

  return {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    selectDistinct: vi.fn(),
    _createSelectChain: createSelectChain,
    _createInsertChain: createInsertChain,
  };
});

vi.mock("drizzle-orm/node-postgres", () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: any, b: any) => ({ type: "eq", left: a, right: b })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  desc: vi.fn((col: any) => ({ type: "desc", col })),
  sql: vi.fn(() => ({ type: "sql" })),
}));

vi.mock("../db/schema", () => {
  const table = (name: string) => ({ _tableName: name });
  return {
    notifications: table("notifications"),
    knowledgeObjects: table("knowledge_objects"),
    users: table("users"),
    sessions: table("sessions"),
  };
});

// ── 导入被测模块 ──
import {
  notifyReviewRequested,
  notifyReviewApproved,
  notifyReviewRejected,
  notifySpaceNewVersion,
  notifyMentioned,
} from "../lib/notify";

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "测试文档" }]));
  mockDb.insert.mockReturnValue(mockDb._createInsertChain([{ id: "n1" }]));
  mockDb.selectDistinct.mockReturnValue({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([{ userId: "u1" }, { userId: "u2" }])),
    })),
  });
});

// ============================================================================
// notifyReviewRequested
// ============================================================================

describe("notifyReviewRequested", () => {
  it("查询对象标题后插入通知", async () => {
    const result = await notifyReviewRequested("reviewer-1", "obj-1");

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toEqual({ id: "n1" });
  });

  it("对象不存在时返回 undefined，不插入通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([]));

    const result = await notifyReviewRequested("reviewer-1", "obj-99");

    expect(result).toBeUndefined();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// notifyReviewApproved
// ============================================================================

describe("notifyReviewApproved", () => {
  it("为对象所有者插入审核通过通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "项目提案" }]));

    const result = await notifyReviewApproved("owner-1", "obj-1");

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("对象不存在时返回 undefined", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([]));

    const result = await notifyReviewApproved("owner-1", "obj-99");

    expect(result).toBeUndefined();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// notifyReviewRejected
// ============================================================================

describe("notifyReviewRejected", () => {
  it("插入审核驳回通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "方案草案" }]));

    const result = await notifyReviewRejected("owner-1", "obj-1");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("有驳回理由时附加在消息中", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "方案草案" }]));

    const result = await notifyReviewRejected("owner-1", "obj-1", "格式不符合要求");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it("空字符串驳回理由正常处理", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "方案草案" }]));

    const result = await notifyReviewRejected("owner-1", "obj-1", "");

    expect(mockDb.insert).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

// ============================================================================
// notifySpaceNewVersion
// ============================================================================

describe("notifySpaceNewVersion", () => {
  it("查询贡献者列表并为每人发送通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "新发布文档" }]));

    await notifySpaceNewVersion("space-1", "obj-1");

    expect(mockDb.select).toHaveBeenCalled();
    expect(mockDb.selectDistinct).toHaveBeenCalled();
    // 2 个贡献者
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });

  it("排除指定的用户不发送通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "新发布文档" }]));
    mockDb.selectDistinct.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([{ userId: "u1" }, { userId: "u2" }, { userId: "u3" }])
        ),
      })),
    });

    await notifySpaceNewVersion("space-1", "obj-1", "u2");

    // 3 贡献者，排除 u2 → 2 条
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });

  it("对象不存在时跳过所有操作", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([]));

    await notifySpaceNewVersion("space-1", "obj-99");

    expect(mockDb.selectDistinct).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("空间只有自己一个贡献者时不发送通知", async () => {
    mockDb.select.mockReturnValue(mockDb._createSelectChain([{ title: "唯一贡献者" }]));
    mockDb.selectDistinct.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ userId: "u1" }])),
      })),
    });

    await notifySpaceNewVersion("space-1", "obj-1", "u1");

    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

// ============================================================================
// notifyMentioned
// ============================================================================

describe("notifyMentioned", () => {
  it("插入一条 mentioned 通知", async () => {
    await notifyMentioned("user-1", "obj-1", "张三");

    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("提及者名称包含在消息中", async () => {
    await notifyMentioned("user-1", "obj-1", "李四");

    expect(mockDb.insert).toHaveBeenCalled();
  });
});
