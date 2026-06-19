import { describe, it, expect } from "vitest";
import { canRead, canEdit, canReview } from "../lib/permissions";

// --- 测试用户 ---
const admin = { id: "u1", name: "Admin", email: "a@x.com", role: "admin", departmentId: "d1" };
const editor = { id: "u2", name: "Editor", email: "e@x.com", role: "editor", departmentId: "d1" };
const viewer = { id: "u3", name: "Viewer", email: "v@x.com", role: "viewer", departmentId: "d2" };
const deptPeer = { id: "u4", name: "Peer", email: "p@x.com", role: "viewer", departmentId: "d1" };
const spaceAdmin = { id: "u5", name: "SpaceAdmin", email: "sa@x.com", role: "viewer", departmentId: "d3" };

// --- 测试对象 ---
const pubObj = {
  id: "k1", visibility: "public" as const, ownerId: "u2", departmentId: "d1", status: "published",
};
const deptObj = {
  id: "k2", visibility: "department" as const, ownerId: "u2", departmentId: "d1", status: "published",
};
const spaceObj = {
  id: "k3", visibility: "space" as const, ownerId: "u2", departmentId: "d1", status: "published",
};
const draftObj = {
  id: "k4", visibility: "space" as const, ownerId: "u2", departmentId: "d1", status: "draft",
};
const pendingObj = {
  id: "k5", visibility: "space" as const, ownerId: "u2", departmentId: "d1", status: "pending_review",
};
const archivedObj = {
  id: "k6", visibility: "public" as const, ownerId: "u2", departmentId: "d1", status: "archived",
};

// ============================================================================
// canRead
// ============================================================================

describe("permissions: canRead", () => {
  // --- admin ---
  it("admin can read any object including archived", () => {
    expect(canRead(admin, draftObj)).toBe(true);
    expect(canRead(admin, pubObj)).toBe(true);
    expect(canRead(admin, archivedObj)).toBe(true);
    expect(canRead(admin, pendingObj)).toBe(true);
  });

  // --- unauthenticated ---
  it("unauthenticated user cannot read any object", () => {
    expect(canRead(undefined, pubObj)).toBe(false);
    expect(canRead(undefined, draftObj)).toBe(false);
    expect(canRead(undefined, pendingObj)).toBe(false);
  });

  // --- owner ---
  it("owner can read own draft", () => {
    expect(canRead(editor, draftObj)).toBe(true);
  });

  it("owner can read own published", () => {
    expect(canRead(editor, pubObj)).toBe(true);
  });

  // --- draft / non-published ---
  it("non-owner cannot read another user's draft (unless reviewer)", () => {
    expect(canRead(viewer, draftObj)).toBe(false);
    expect(canRead(deptPeer, draftObj)).toBe(false);
  });

  it("reviewer can read draft assigned to them", () => {
    const result = canRead(viewer, draftObj, [
      { granteeType: "user", granteeId: "u3", permission: "review" },
    ]);
    expect(result).toBe(true);
  });

  it("non-reviewer cannot read draft even with view grant", () => {
    // draft 不响应 view grant，只有 review grant 可以
    const result = canRead(deptPeer, draftObj, [
      { granteeType: "user", granteeId: "u4", permission: "view" },
    ]);
    expect(result).toBe(false);
  });

  // --- public ---
  it("any authenticated user can read public published", () => {
    expect(canRead(viewer, pubObj)).toBe(true);
    expect(canRead(deptPeer, pubObj)).toBe(true);
  });

  // --- department ---
  it("same department user can read department-scoped", () => {
    expect(canRead(editor, deptObj)).toBe(true);
    expect(canRead(deptPeer, deptObj)).toBe(true);
  });

  it("different department user cannot read department-scoped", () => {
    expect(canRead(viewer, deptObj)).toBe(false);
  });

  // --- space (same as department rule) ---
  it("same department user can read space-scoped", () => {
    expect(canRead(deptPeer, spaceObj)).toBe(true);
  });

  it("different department user cannot read space-scoped", () => {
    expect(canRead(viewer, spaceObj)).toBe(false);
  });

  // --- explicit grants ---
  it("explicit view grant allows reading even across departments", () => {
    const result = canRead(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "view" },
    ]);
    expect(result).toBe(true);
  });

  it("explicit edit grant also allows reading", () => {
    const result = canRead(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "edit" },
    ]);
    expect(result).toBe(true);
  });

  it("explicit review grant also allows reading", () => {
    const result = canRead(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "review" },
    ]);
    expect(result).toBe(true);
  });

  it("multiple grants pick the most permissive access", () => {
    const result = canRead(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "view" },
      { granteeType: "user", granteeId: "u5", permission: "edit" },
    ]);
    expect(result).toBe(true);
  });

  it("grant for different user does not allow access", () => {
    const result = canRead(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u99", permission: "view" },
    ]);
    expect(result).toBe(false);
  });

  // --- null departmentId ---
  it("user with null departmentId can read public but not department-scoped", () => {
    const noDept = { id: "u9", name: "NoDept", email: "n@x.com", role: "viewer", departmentId: null };
    expect(canRead(noDept, pubObj)).toBe(true);
    expect(canRead(noDept, deptObj)).toBe(false);
  });

  // --- space admin via explicit grants ---
  it("space admin (via edit grant) can read space-scoped", () => {
    const result = canRead(spaceAdmin, spaceObj, [
      { granteeType: "user", granteeId: "u5", permission: "edit" },
    ]);
    expect(result).toBe(true);
  });
});

// ============================================================================
// canEdit
// ============================================================================

describe("permissions: canEdit", () => {
  it("admin can edit any object", () => {
    expect(canEdit(admin, pubObj)).toBe(true);
    expect(canEdit(admin, draftObj)).toBe(true);
    expect(canEdit(admin, archivedObj)).toBe(true);
  });

  it("unauthenticated user cannot edit", () => {
    expect(canEdit(undefined, pubObj)).toBe(false);
  });

  it("owner can edit own object", () => {
    expect(canEdit(editor, spaceObj)).toBe(true);
    expect(canEdit(editor, draftObj)).toBe(true);
  });

  it("non-owner non-admin cannot edit without grant", () => {
    expect(canEdit(viewer, spaceObj)).toBe(false);
    expect(canEdit(deptPeer, spaceObj)).toBe(false);
  });

  it("explicit edit grant allows editing", () => {
    const result = canEdit(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "edit" },
    ]);
    expect(result).toBe(true);
  });

  it("view grant does not allow editing", () => {
    const result = canEdit(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "view" },
    ]);
    expect(result).toBe(false);
  });

  it("review grant does not allow editing", () => {
    const result = canEdit(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u3", permission: "review" },
    ]);
    expect(result).toBe(false);
  });

  it("space admin (via edit grant) can edit", () => {
    const result = canEdit(spaceAdmin, spaceObj, [
      { granteeType: "user", granteeId: "u5", permission: "edit" },
    ]);
    expect(result).toBe(true);
  });

  it("department peer cannot edit even if same department", () => {
    // Same department 不等于编辑权限
    expect(canEdit(deptPeer, deptObj)).toBe(false);
  });

  it("grant for wrong user does not grant edit", () => {
    const result = canEdit(viewer, spaceObj, [
      { granteeType: "user", granteeId: "u99", permission: "edit" },
    ]);
    expect(result).toBe(false);
  });
});

// ============================================================================
// canReview
// ============================================================================

describe("permissions: canReview", () => {
  it("admin can review", () => {
    expect(canReview(admin, pubObj)).toBe(true);
    expect(canReview(admin, draftObj)).toBe(true);
  });

  it("unauthenticated user cannot review", () => {
    expect(canReview(undefined, pubObj)).toBe(false);
  });

  it("regular user without grant cannot review", () => {
    expect(canReview(editor, pubObj)).toBe(false);
  });

  it("explicit review grant allows review", () => {
    const allowed = canReview(viewer, pubObj, [
      { granteeType: "user", granteeId: "u3", permission: "review" },
    ]);
    expect(allowed).toBe(true);
  });

  it("view grant does not allow review", () => {
    const result = canReview(viewer, pubObj, [
      { granteeType: "user", granteeId: "u3", permission: "view" },
    ]);
    expect(result).toBe(false);
  });

  it("edit grant does not allow review", () => {
    const result = canReview(viewer, pubObj, [
      { granteeType: "user", granteeId: "u3", permission: "edit" },
    ]);
    expect(result).toBe(false);
  });

  it("owner cannot review own object without explicit grant", () => {
    expect(canReview(editor, deptObj)).toBe(false);
  });

  it("multiple grants pick the review grant", () => {
    const result = canReview(viewer, pubObj, [
      { granteeType: "user", granteeId: "u3", permission: "view" },
      { granteeType: "user", granteeId: "u3", permission: "review" },
    ]);
    expect(result).toBe(true);
  });

  it("grant for wrong user does not allow review", () => {
    const result = canReview(viewer, pubObj, [
      { granteeType: "user", granteeId: "u99", permission: "review" },
    ]);
    expect(result).toBe(false);
  });
});
