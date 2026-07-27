import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const role = pgEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "DESIGNER",
  "EDITOR",
  "CONTENT_EDITOR",
  "MARKETING_MANAGER",
  "VIEWER",
]);
export const pageStatus = pgEnum("page_status", [
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
  "ARCHIVED",
]);

const audit = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: role("role").default("ADMIN").notNull(),
    active: boolean("active").default(true).notNull(),
    ...audit,
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("sessions_token_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: pageStatus("status").default("DRAFT").notNull(),
    authorId: uuid("author_id").references(() => users.id),
    seo: jsonb("seo").default({}).notNull(),
    settings: jsonb("settings").default({}).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...audit,
  },
  (t) => [uniqueIndex("pages_slug_unique").on(t.slug)],
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .references(() => pages.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    content: jsonb("content").default({}).notNull(),
    draftContent: jsonb("draft_content").default({}).notNull(),
    publishedContent: jsonb("published_content").default({}).notNull(),
    styles: jsonb("styles").default({}).notNull(),
    responsive: jsonb("responsive").default({}).notNull(),
    animation: jsonb("animation").default({}).notNull(),
    visible: boolean("visible").default(true).notNull(),
    locked: boolean("locked").default(false).notNull(),
    ...audit,
  },
  (t) => [index("sections_page_position_idx").on(t.pageId, t.position)],
);

export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pageId: uuid("page_id")
      .references(() => pages.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id").references(() => users.id),
    label: text("label"),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("revisions_page_created_idx").on(t.pageId, t.createdAt)],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminResources = pgTable(
  "admin_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    module: text("module").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: text("status").default("DRAFT").notNull(),
    data: jsonb("data").default({}).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...audit,
  },
  (t) => [
    index("admin_resources_module_idx").on(t.module),
    uniqueIndex("admin_resources_module_slug_unique").on(t.module, t.slug),
  ],
);

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email"),
  status: text("status").default("OPEN").notNull(),
  important: boolean("important").default(false).notNull(),
  // IKORA answers while true; flips false when a human admin takes over.
  aiEnabled: boolean("ai_enabled").default(true).notNull(),
  // Visitor's 1-5 rating of the chat, collected when they end it.
  rating: integer("rating"),
  unreadAdmin: integer("unread_admin").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => chatConversations.id, { onDelete: "cascade" })
    .notNull(),
  sender: text("sender").notNull(), // 'visitor' | 'admin'
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  phone: text("phone"),
  budget: text("budget"),
  service: text("service"),
  message: text("message"),
  source: text("source").default("contact").notNull(),
  status: text("status").default("NEW").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .references(() => adminResources.id, { onDelete: "cascade" })
      .notNull(),
    data: jsonb("data").default({}).notNull(),
    status: text("status").default("UNREAD").notNull(),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("form_submissions_form_created_idx").on(t.formId, t.createdAt)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: text("user_name").notNull(),
    userRole: text("user_role").notNull(),
    module: text("module").notNull(), // pages | posts | media | menus | users | settings | ...
    action: text("action").notNull(), // created | updated | published | trashed | deleted | ...
    targetLabel: text("target_label").default("").notNull(),
    targetId: text("target_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("activity_log_created_idx").on(t.createdAt)],
);

export const pageViews = pgTable(
  "page_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull(),
    referrer: text("referrer").default("").notNull(),
    referrerHost: text("referrer_host").default("").notNull(),
    country: text("country").default("").notNull(),
    device: text("device").default("").notNull(),
    sessionId: text("session_id").default("").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("page_views_created_idx").on(t.createdAt),
    index("page_views_path_idx").on(t.path),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    contentBase64: text("content_base64").notNull(),
    title: text("title").notNull(),
    altText: text("alt_text").default("").notNull(),
    caption: text("caption").default("").notNull(),
    description: text("description").default("").notNull(),
    tags: jsonb("tags").default([]).notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...audit,
  },
  (t) => [
    index("media_assets_created_idx").on(t.createdAt),
    index("media_assets_type_idx").on(t.mimeType),
  ],
);
