interface User { id: string; name: string; email: string; role: string; departmentId: string | null; }

interface KnowledgeObject {
  id: string;
  visibility: "space" | "department" | "public";
  ownerId: string;
  departmentId: string;
  status: string;
}

interface ExtraGrant {
  granteeType: string;
  granteeId: string;
  permission: string;
}

/**
 * Determine if a user can read a knowledge object.
 * Permission cascade: admin > public > same department > explicit viewer grants
 */
export function canRead(
  user: User | undefined,
  obj: KnowledgeObject,
  extraGrants: ExtraGrant[] = [],
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  // Published objects follow visibility rules; drafts are owner/reviewer only
  if (obj.status !== "published") {
    if (obj.ownerId === user.id) return true;
    // Also allow reviewer to read
    const reviewGrant = extraGrants.find(
      (g) => g.granteeType === "user" && g.granteeId === user.id && g.permission === "review",
    );
    return !!reviewGrant;
  }

  if (obj.visibility === "public") return true;
  if (obj.ownerId === user.id) return true;

  if (obj.visibility === "department" || obj.visibility === "space") {
    if (user.departmentId === obj.departmentId) return true;
  }

  // Check explicit viewer grants
  return extraGrants.some(
    (g) =>
      g.granteeType === "user" &&
      g.granteeId === user.id &&
      (g.permission === "view" || g.permission === "edit" || g.permission === "review"),
  );
}

/**
 * Determine if a user can edit a knowledge object.
 * Admins, owners, and users with explicit edit grants can edit.
 */
export function canEdit(
  user: User | undefined,
  obj: KnowledgeObject,
  extraGrants: ExtraGrant[] = [],
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (obj.ownerId === user.id) return true;

  return extraGrants.some(
    (g) =>
      g.granteeType === "user" &&
      g.granteeId === user.id &&
      g.permission === "edit",
  );
}

/**
 * Determine if a user can review (approve/reject) a knowledge object.
 */
export function canReview(
  user: User | undefined,
  _obj: KnowledgeObject,
  extraGrants: ExtraGrant[] = [],
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  return extraGrants.some(
    (g) =>
      g.granteeType === "user" &&
      g.granteeId === user.id &&
      g.permission === "review",
  );
}
