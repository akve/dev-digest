ALTER TABLE "conventions" ADD COLUMN "category" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "conventions" ADD COLUMN "evidence_line_start" integer;--> statement-breakpoint
ALTER TABLE "conventions" ADD COLUMN "evidence_line_end" integer;--> statement-breakpoint
ALTER TABLE "conventions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;