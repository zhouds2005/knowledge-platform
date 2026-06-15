import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Validate request body against a Zod schema.
 * Returns 400 with field-level errors on failure.
 */
export function validate(schema: z.ZodType<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    req.body = result.data;
    next();
  };
}

// ---- Knowledge Object Schemas ----

export const createKnowledgeSchema = z.object({
  type: z.enum(["document", "wiki", "drive_file"]),
  title: z.string().min(1, "标题不能为空").max(500, "标题最多 500 字"),
  description: z.string().max(10000, "描述最多 10000 字").optional().nullable(),
  tags: z.array(z.string().max(100)).max(20, "最多 20 个标签").optional(),
  spaceId: z.string().uuid("无效的空间 ID"),
  visibility: z.enum(["space", "department", "public"]).optional(),
  sourceTable: z.string().max(100).optional(),
  sourceId: z.string().uuid().optional(),
});

export const updateKnowledgeSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  visibility: z.enum(["space", "department", "public"]).optional(),
});

// ---- Department Schemas ----

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100, "名称最多 100 字"),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

// ---- Space Schemas ----

export const createSpaceSchema = z.object({
  departmentId: z.string().uuid("无效的部门 ID"),
  name: z.string().min(1, "名称不能为空").max(200, "名称最多 200 字"),
  description: z.string().max(5000).optional().nullable(),
  defaultReviewerId: z.string().uuid().optional().nullable(),
});

export const updateSpaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  defaultReviewerId: z.string().uuid().optional().nullable(),
  autoPublish: z.boolean().optional(),
});

// ---- User Schemas ----

export const createUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(100, "姓名最多 100 字"),
  email: z.string().email("邮箱格式无效").max(255, "邮箱最多 255 字"),
  password: z.string().min(6, "密码至少 6 位").max(128, "密码最多 128 位"),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  departmentId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  password: z.string().min(6).max(128).optional(),
});
