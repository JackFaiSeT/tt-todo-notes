CREATE TABLE `drafts` (
	`key` text PRIMARY KEY NOT NULL,
	`base_version` integer,
	`payload` text NOT NULL,
	`saved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_updated_at` ON `notes` (`updated_at`);--> statement-breakpoint
CREATE TABLE `todos` (
	`id` text NOT NULL,
	`note_id` text NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	`done` integer NOT NULL,
	PRIMARY KEY(`note_id`, `id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `todos_note_position` ON `todos` (`note_id`,`position`);