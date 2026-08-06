CREATE TABLE "hosting_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_ref" text NOT NULL,
	"plan_id" uuid,
	"plan_name" text NOT NULL,
	"plan_price" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"domain_type" text NOT NULL,
	"domain_name" text NOT NULL,
	"domain_price" integer DEFAULT 0 NOT NULL,
	"total_paid" integer NOT NULL,
	"payment_status" text DEFAULT 'TEST_PAID' NOT NULL,
	"payment_provider" text DEFAULT 'mock' NOT NULL,
	"payment_ref" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"wp_admin_url" text DEFAULT '' NOT NULL,
	"wp_username" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"credentials_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_orders_order_ref_unique" UNIQUE("order_ref")
);
--> statement-breakpoint
CREATE TABLE "hosting_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"price_monthly" integer NOT NULL,
	"storage_gb" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD CONSTRAINT "hosting_orders_plan_id_hosting_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."hosting_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosting_orders_status_idx" ON "hosting_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hosting_orders_created_idx" ON "hosting_orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hosting_orders_domain_unique" ON "hosting_orders" USING btree ("domain_name");