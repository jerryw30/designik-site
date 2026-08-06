CREATE TABLE "hosting_customer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_customer_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "hosting_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosting_customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "hosting_customer_sessions" ADD CONSTRAINT "hosting_customer_sessions_customer_id_hosting_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."hosting_customers"("id") ON DELETE cascade ON UPDATE no action;