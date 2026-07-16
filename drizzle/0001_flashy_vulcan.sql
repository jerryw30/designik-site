ALTER TABLE "sections" ADD COLUMN "draft_content" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sections" ADD COLUMN "published_content" jsonb DEFAULT '{}'::jsonb NOT NULL;