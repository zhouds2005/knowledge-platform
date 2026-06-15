import { describe, it, expect } from "vitest";
import {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  createUserSchema,
  updateUserSchema,
  createDepartmentSchema,
  createSpaceSchema,
} from "../lib/validate";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ============================================================
// createKnowledgeSchema
// ============================================================

describe("createKnowledgeSchema", () => {
  const valid = { type: "document", title: "测试文档", spaceId: VALID_UUID };

  it("正常数据通过", () => {
    expect(createKnowledgeSchema.safeParse(valid).success).toBe(true);
  });

  it("标题为空报错", () => {
    const r = createKnowledgeSchema.safeParse({ ...valid, title: "" });
    expect(r.success).toBe(false);
  });

  it("标题超 500 字报错", () => {
    const r = createKnowledgeSchema.safeParse({ ...valid, title: "x".repeat(501) });
    expect(r.success).toBe(false);
  });

  it("标题 500 字刚好通过", () => {
    expect(createKnowledgeSchema.safeParse({ ...valid, title: "x".repeat(500) }).success).toBe(true);
  });

  it("type 不在枚举报错", () => {
    const r = createKnowledgeSchema.safeParse({ ...valid, type: "pdf" });
    expect(r.success).toBe(false);
  });

  it("缺少 spaceId 报错", () => {
    const { spaceId, ...rest } = valid;
    expect(createKnowledgeSchema.safeParse(rest).success).toBe(false);
  });

  it("可选字段不传可通过", () => {
    expect(createKnowledgeSchema.safeParse(valid).success).toBe(true);
  });
});

// ============================================================
// updateKnowledgeSchema
// ============================================================

describe("updateKnowledgeSchema", () => {
  it("空对象通过（所有字段可选）", () => {
    expect(updateKnowledgeSchema.safeParse({}).success).toBe(true);
  });

  it("部分字段更新通过", () => {
    expect(updateKnowledgeSchema.safeParse({ title: "新标题" }).success).toBe(true);
  });

  it("visibility 非法值报错", () => {
    const r = updateKnowledgeSchema.safeParse({ visibility: "secret" });
    expect(r.success).toBe(false);
  });
});

// ============================================================
// createUserSchema
// ============================================================

describe("createUserSchema", () => {
  const valid = { name: "张三", email: "a@b.com", password: "123456" };

  it("正常数据通过", () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true);
  });

  it("密码小于 6 位报错", () => {
    const r = createUserSchema.safeParse({ ...valid, password: "12345" });
    expect(r.success).toBe(false);
  });

  it("邮箱格式错报错", () => {
    const r = createUserSchema.safeParse({ ...valid, email: "not-email" });
    expect(r.success).toBe(false);
  });

  it("姓名为空报错", () => {
    const r = createUserSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("role 可选，不传默认", () => {
    const r = createUserSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.role).toBeUndefined();
  });
});

// ============================================================
// updateUserSchema
// ============================================================

describe("updateUserSchema", () => {
  it("空对象通过（所有字段可选）", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });

  it("只更新角色通过", () => {
    expect(updateUserSchema.safeParse({ role: "admin" }).success).toBe(true);
  });

  it("非法角色报错", () => {
    const r = updateUserSchema.safeParse({ role: "superadmin" });
    expect(r.success).toBe(false);
  });
});

// ============================================================
// createDepartmentSchema
// ============================================================

describe("createDepartmentSchema", () => {
  it("正常数据通过", () => {
    expect(createDepartmentSchema.safeParse({ name: "技术部" }).success).toBe(true);
  });

  it("名称为空报错", () => {
    expect(createDepartmentSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("名称超 100 字报错", () => {
    const r = createDepartmentSchema.safeParse({ name: "x".repeat(101) });
    expect(r.success).toBe(false);
  });

  it("可选 parentId", () => {
    expect(createDepartmentSchema.safeParse({ name: "子部门", parentId: VALID_UUID }).success).toBe(true);
  });
});

// ============================================================
// createSpaceSchema
// ============================================================

describe("createSpaceSchema", () => {
  const valid = { name: "API文档", departmentId: VALID_UUID };

  it("正常数据通过", () => {
    expect(createSpaceSchema.safeParse(valid).success).toBe(true);
  });

  it("缺少 departmentId 报错", () => {
    expect(createSpaceSchema.safeParse({ name: "API文档" }).success).toBe(false);
  });

  it("名称为空报错", () => {
    const r = createSpaceSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("description 可选", () => {
    expect(createSpaceSchema.safeParse({ ...valid, description: "说明" }).success).toBe(true);
  });

  it("defaultReviewerId 可选", () => {
    expect(createSpaceSchema.safeParse({ ...valid, defaultReviewerId: VALID_UUID }).success).toBe(true);
  });
});
