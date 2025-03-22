CREATE TABLE `files` (
	`object_id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`access` text DEFAULT 'public' NOT NULL,
	`size` integer NOT NULL,
	`content_hash` text NOT NULL,
	`content_type` text NOT NULL,
	`filename` text NOT NULL,
	`metadata` text,
	`user_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_external_id_unique` ON `files` (`external_id`);--> statement-breakpoint
CREATE INDEX `external_id_idx` ON `files` (`external_id`);--> statement-breakpoint
CREATE INDEX `content_hash_idx` ON `files` (`content_hash`);