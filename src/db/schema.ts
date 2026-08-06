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
  // Visitor geo captured from the request headers (Vercel edge geo).
  countryCode: text("country_code"),
  city: text("city"),
  ip: text("ip"),
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
  sender: text("sender").notNull(), // 'visitor' | 'admin' | 'assistant'
  // Professional display name for admin messages (e.g. "Luke Carter").
  senderName: text("sender_name"),
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
    // An asset stores its bytes one of two ways, never both:
    //  · contentBase64 — uploaded through the admin, bytes live in Postgres
    //    (hence the 4MB cap; base64 inflates payloads by ~33%).
    //  · filePath — a file already shipped in public/, e.g. "/figma/hero.png".
    //    The Figma exports register this way so the library can title and alt
    //    them without copying 149MB of PNGs into Neon.
    contentBase64: text("content_base64"),
    filePath: text("file_path"),
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

/* ---------------- Hosting storefront (Build your WordPress site) ---------- */

export const hostingPlans = pgTable("hosting_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** Monthly price in cents (display + checkout). */
  priceMonthly: integer("price_monthly").notNull(),
  storageGb: integer("storage_gb").notNull(),
  /** Marketing bullet points, ordered. */
  features: jsonb("features").default([]).notNull(),
  position: integer("position").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...audit,
});

export const hostingOrders = pgTable(
  "hosting_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Short human ref shown to the customer (e.g. DGK-3F7A2C). */
    orderRef: text("order_ref").notNull().unique(),
    planId: uuid("plan_id").references(() => hostingPlans.id),
    planName: text("plan_name").notNull(),
    planPrice: integer("plan_price").notNull(),
    /** Set for orders placed by a logged-in storefront account. */
    customerId: uuid("customer_id"),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    /** "temp" = subdomain of designik.us · "new" = we register · "own" = customer brings one */
    domainType: text("domain_type").notNull(),
    /** Full domain (new/own) or full temp host like "acme.designik.us". */
    domainName: text("domain_name").notNull(),
    domainPrice: integer("domain_price").default(0).notNull(),
    totalPaid: integer("total_paid").notNull(),
    /** TEST_PAID until a real payment provider is wired in. */
    paymentStatus: text("payment_status").default("TEST_PAID").notNull(),
    paymentProvider: text("payment_provider").default("mock").notNull(),
    paymentRef: text("payment_ref").default("").notNull(),
    /** PENDING → PROVISIONING → ACTIVE | CANCELLED */
    status: text("status").default("PENDING").notNull(),
    /** Admin override of the plan's storage for this customer (GB). */
    storageGbOverride: integer("storage_gb_override"),
    /** Template choice, site-details form, domain-connection service, etc. */
    details: jsonb("details").default({}).notNull(),
    /** Blocked customers keep their row but the site is suspended and the
        email can't place new orders. */
    blocked: boolean("blocked").default(false).notNull(),
    wpAdminUrl: text("wp_admin_url").default("").notNull(),
    wpUsername: text("wp_username").default("").notNull(),
    notes: text("notes").default("").notNull(),
    credentialsSentAt: timestamp("credentials_sent_at", { withTimezone: true }),
    ...audit,
  },
  (t) => [
    index("hosting_orders_status_idx").on(t.status),
    index("hosting_orders_created_idx").on(t.createdAt),
    uniqueIndex("hosting_orders_domain_unique").on(t.domainName),
  ],
);

/** Storefront customer accounts — separate from admin `users` on purpose so
    hosting customers can never carry CMS roles. */
export const hostingCustomers = pgTable("hosting_customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  blocked: boolean("blocked").default(false).notNull(),
  ...audit,
});

export const hostingCustomerSessions = pgTable("hosting_customer_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => hostingCustomers.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...audit,
});
