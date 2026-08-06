ALTER TABLE "hosting_orders" ADD COLUMN "storage_gb_override" integer;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "blocked" boolean DEFAULT false NOT NULL;