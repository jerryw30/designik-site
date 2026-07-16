import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const role = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "DESIGNER", "EDITOR", "CONTENT_EDITOR", "MARKETING_MANAGER", "VIEWER"]);
export const pageStatus = pgEnum("page_status", ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]);

const audit = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(), name: text("name").notNull(), passwordHash: text("password_hash").notNull(),
  role: role("role").default("ADMIN").notNull(), active: boolean("active").default(true).notNull(), ...audit,
}, (t) => [uniqueIndex("users_email_unique").on(t.email)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("sessions_token_unique").on(t.tokenHash), index("sessions_user_idx").on(t.userId)]);

export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), slug: text("slug").notNull(), status: pageStatus("status").default("DRAFT").notNull(),
  authorId: uuid("author_id").references(() => users.id), seo: jsonb("seo").default({}).notNull(), settings: jsonb("settings").default({}).notNull(), publishedAt: timestamp("published_at", { withTimezone: true }), deletedAt: timestamp("deleted_at", { withTimezone: true }), ...audit,
}, (t) => [uniqueIndex("pages_slug_unique").on(t.slug)]);

export const sections = pgTable("sections", {
  id: uuid("id").defaultRandom().primaryKey(), pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), name: text("name").notNull(), position: integer("position").notNull(), content: jsonb("content").default({}).notNull(),
  draftContent: jsonb("draft_content").default({}).notNull(), publishedContent: jsonb("published_content").default({}).notNull(),
  styles: jsonb("styles").default({}).notNull(), responsive: jsonb("responsive").default({}).notNull(), animation: jsonb("animation").default({}).notNull(), visible: boolean("visible").default(true).notNull(), locked: boolean("locked").default(false).notNull(), ...audit,
}, (t) => [index("sections_page_position_idx").on(t.pageId, t.position)]);

export const revisions = pgTable("revisions", {
  id: uuid("id").defaultRandom().primaryKey(), pageId: uuid("page_id").references(() => pages.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id), label: text("label"), snapshot: jsonb("snapshot").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("revisions_page_created_idx").on(t.pageId, t.createdAt)]);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(), value: jsonb("value").notNull(), updatedBy: uuid("updated_by").references(() => users.id), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
