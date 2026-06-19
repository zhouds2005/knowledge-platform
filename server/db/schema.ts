import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";

// ---- Custom Types ----

const tsvector = customType<{ data: string }>({
  dataType() { return "tsvector"; },
});

// ---- Enums ----

export const roleEnum = pgEnum("role", ["admin", "editor", "viewer"]);
export const objectTypeEnum = pgEnum("object_type", [
  "document",
  "wiki",
  "drive_file",
]);
export const objectStatusEnum = pgEnum("object_status", [
  "draft",
  "pending_review",
  "published",
  "archived",
]);
export const visibilityEnum = pgEnum("visibility", [
  "space",
  "department",
  "public",
]);
export const permissionEnum = pgEnum("permission", ["view", "edit", "review"]);
export const reviewActionEnum = pgEnum("review_action", [
  "approved",
  "rejected",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "review_requested",
  "review_approved",
  "review_rejected",
  "new_version",
  "mentioned",
]);
export const relationTypeEnum = pgEnum("relation_type", [
  "references",
  "attaches",
  "belongs_to",
]);

// ---- Tables ----

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("viewer"),
    departmentId: uuid("department_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_users_email").on(t.email)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const knowledgeSpaces = pgTable(
  "knowledge_spaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    defaultReviewerId: uuid("default_reviewer_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    autoPublish: boolean("auto_publish").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_knowledge_spaces_department").on(t.departmentId)],
);

export const knowledgeObjects = pgTable(
  "knowledge_objects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: objectTypeEnum("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    tags: text("tags").array(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    spaceId: uuid("space_id")
      .notNull()
      .references(() => knowledgeSpaces.id, { onDelete: "cascade" }),

    // Status & review
    status: objectStatusEnum("status").default("draft").notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at"),
    version: integer("version").default(1).notNull(),

    // Access control
    visibility: visibilityEnum("visibility").default("space").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Source polymorphic reference
    sourceTable: varchar("source_table", { length: 100 }).notNull(),
    sourceId: uuid("source_id").notNull(),

    // Full-text search vector (managed by database trigger)
    searchVector: tsvector("search_vector"),

    // Stats
    viewCount: integer("view_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_knowledge_objects_space").on(t.spaceId),
    index("idx_knowledge_objects_department").on(t.departmentId),
    index("idx_knowledge_objects_status").on(t.status),
    index("idx_knowledge_objects_type").on(t.type),
    index("idx_knowledge_objects_owner").on(t.ownerId),
  ],
);

export const objectPermissions = pgTable(
  "object_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectId: uuid("object_id")
      .notNull()
      .references(() => knowledgeObjects.id, { onDelete: "cascade" }),
    granteeType: varchar("grantee_type", { length: 10 }).notNull(), // "user" | "role"
    granteeId: varchar("grantee_id", { length: 100 }).notNull(),
    permission: permissionEnum("permission").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_object_permissions_object").on(t.objectId),
    index("idx_object_permissions_grantee").on(t.granteeType, t.granteeId),
  ],
);

export const reviewRecords = pgTable(
  "review_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    objectId: uuid("object_id")
      .notNull()
      .references(() => knowledgeObjects.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: reviewActionEnum("action").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_review_records_object").on(t.objectId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    objectId: uuid("object_id").references(() => knowledgeObjects.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("idx_notifications_user").on(t.userId)],
);

export const objectRelations = pgTable(
  "object_relations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceObjectId: uuid("source_object_id")
      .notNull()
      .references(() => knowledgeObjects.id, { onDelete: "cascade" }),
    targetObjectId: uuid("target_object_id")
      .notNull()
      .references(() => knowledgeObjects.id, { onDelete: "cascade" }),
    relationType: relationTypeEnum("relation_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_object_relations_source").on(t.sourceObjectId),
    index("idx_object_relations_target").on(t.targetObjectId),
    index("idx_object_relations_type").on(t.relationType),
  ],
);
