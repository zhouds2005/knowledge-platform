import { relations } from "drizzle-orm";
import {
  users,
  departments,
  knowledgeSpaces,
  knowledgeObjects,
  objectPermissions,
  reviewRecords,
  notifications,
  objectRelations,
  sessions,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  sessions: many(sessions),
  notifications: many(notifications),
  ownedObjects: many(knowledgeObjects, { relationName: "owner" }),
  reviewRecords: many(reviewRecords),
  reviewedSpaces: many(knowledgeSpaces, { relationName: "reviewer" }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  knowledgeSpaces: many(knowledgeSpaces),
  knowledgeObjects: many(knowledgeObjects),
}));

export const knowledgeSpacesRelations = relations(
  knowledgeSpaces,
  ({ one, many }) => ({
    department: one(departments, {
      fields: [knowledgeSpaces.departmentId],
      references: [departments.id],
    }),
    defaultReviewer: one(users, {
      fields: [knowledgeSpaces.defaultReviewerId],
      references: [users.id],
      relationName: "reviewer",
    }),
    knowledgeObjects: many(knowledgeObjects),
  }),
);

export const knowledgeObjectsRelations = relations(
  knowledgeObjects,
  ({ one, many }) => ({
    department: one(departments, {
      fields: [knowledgeObjects.departmentId],
      references: [departments.id],
    }),
    space: one(knowledgeSpaces, {
      fields: [knowledgeObjects.spaceId],
      references: [knowledgeSpaces.id],
    }),
    owner: one(users, {
      fields: [knowledgeObjects.ownerId],
      references: [users.id],
      relationName: "owner",
    }),
    reviewer: one(users, {
      fields: [knowledgeObjects.reviewerId],
      references: [users.id],
    }),
    permissions: many(objectPermissions),
    reviewRecords: many(reviewRecords),
    relationsFrom: many(objectRelations, { relationName: "source" }),
    relationsTo: many(objectRelations, { relationName: "target" }),
  }),
);

export const objectPermissionsRelations = relations(
  objectPermissions,
  ({ one }) => ({
    knowledgeObject: one(knowledgeObjects, {
      fields: [objectPermissions.objectId],
      references: [knowledgeObjects.id],
    }),
  }),
);

export const reviewRecordsRelations = relations(reviewRecords, ({ one }) => ({
  knowledgeObject: one(knowledgeObjects, {
    fields: [reviewRecords.objectId],
    references: [knowledgeObjects.id],
  }),
  reviewer: one(users, {
    fields: [reviewRecords.reviewerId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  knowledgeObject: one(knowledgeObjects, {
    fields: [notifications.objectId],
    references: [knowledgeObjects.id],
  }),
}));

export const objectRelationsRelations = relations(
  objectRelations,
  ({ one }) => ({
    source: one(knowledgeObjects, {
      fields: [objectRelations.sourceObjectId],
      references: [knowledgeObjects.id],
      relationName: "source",
    }),
    target: one(knowledgeObjects, {
      fields: [objectRelations.targetObjectId],
      references: [knowledgeObjects.id],
      relationName: "target",
    }),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
