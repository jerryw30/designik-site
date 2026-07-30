-- Media library: allow assets that reference a file in public/ instead of
-- embedding their bytes as base64 in Postgres.
--
-- NOTE: drizzle-kit generated this file with CREATE TABLE statements for
-- activity_log, chat_conversations, chat_messages, leads and page_views.
-- Those tables already exist in production with live data — they were created
-- with `drizzle-kit push`, so snapshot 0005 never recorded them. Running the
-- generated SQL would have failed on the first CREATE TABLE and never reached
-- the two ALTERs below. Only the media_assets changes are kept here; the 0006
-- meta snapshot is complete, so future `generate` runs diff correctly.

ALTER TABLE "media_assets" ALTER COLUMN "content_base64" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "file_path" text;
