import { describe, it, expect } from "vitest";
import { canRead, canEdit, canReview } from "../lib/permissions";

const adminUser = { id: "u1", name: "Admin", email: "a@t.com", role: "admin", departmentId: "d1" };
const editorUser = { id: "u2", name: "Ed", email: "e@t.com", role: "editor", departmentId: "d1" };
const viewerUser = { id: "u3", name: "Vw", email: "v@t.com", role: "viewer", departmentId: "d2" };
const baseObj = { id: "o1", visibility: "department" as const, ownerId: "u2", departmentId: "d1", status: "published" };

describe("canRead", () => {
  it("should allow admin to read anything", () => expect(canRead(adminUser, baseObj)).toBe(true));
  it("should allow owner to read published", () => expect(canRead(editorUser, baseObj)).toBe(true));
  it("should allow same-department user", () => {
    const user = { ...viewerUser, departmentId: "d1" };
    expect(canRead(user, baseObj)).toBe(true);
  });
  it("should deny different-department viewer", () => expect(canRead(viewerUser, baseObj)).toBe(false));
  it("should allow public visibility to anyone", () => {
    const obj = { ...baseObj, visibility: "public" as const };
    expect(canRead(viewerUser, obj)).toBe(true);
  });
  it("should deny unauthenticated", () => expect(canRead(undefined, baseObj)).toBe(false));
  it("should allow owner to read draft", () => {
    const obj = { ...baseObj, status: "draft" };
    expect(canRead(editorUser, obj)).toBe(true);
  });
  it("should deny non-owner reading draft", () => {
    const obj = { ...baseObj, status: "draft" };
    expect(canRead(viewerUser, obj)).toBe(false);
  });
  it("should allow explicit viewer grant", () => {
    expect(canRead(viewerUser, baseObj, [{ granteeType: "user", granteeId: "u3", permission: "view" }])).toBe(true);
  });
});

describe("canEdit", () => {
  it("should allow admin", () => expect(canEdit(adminUser, baseObj)).toBe(true));
  it("should allow owner", () => expect(canEdit(editorUser, baseObj)).toBe(true));
  it("should deny non-owner", () => expect(canEdit(viewerUser, baseObj)).toBe(false));
  it("should allow explicit edit grant", () => {
    expect(canEdit(viewerUser, baseObj, [{ granteeType: "user", granteeId: "u3", permission: "edit" }])).toBe(true);
  });
});

describe("canReview", () => {
  it("should allow admin", () => expect(canReview(adminUser, baseObj)).toBe(true));
  it("should deny regular user", () => expect(canReview(editorUser, baseObj)).toBe(false));
  it("should allow explicit review grant", () => {
    expect(canReview(editorUser, baseObj, [{ granteeType: "user", granteeId: "u2", permission: "review" }])).toBe(true);
  });
});
