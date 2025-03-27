CREATE TABLE `properties` (
	`id` text NOT NULL,
	`object_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`object_id`, `key`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_id_unique` ON `properties` (`id`);--> statement-breakpoint
CREATE INDEX `object_idx` ON `properties` (`object_id`);--> statement-breakpoint
CREATE INDEX `project_key_value_idx` ON `properties` (`project_id`,`key`,`value`);--> statement-breakpoint
CREATE INDEX `user_key_value_idx` ON `properties` (`user_id`,`key`,`value`);--> statement-breakpoint
CREATE INDEX `value_idx` ON `properties` (`value`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `properties` (`key`,`object_id`);