PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_todos` (
	`id` text NOT NULL,
	`note_id` text NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	`done` integer NOT NULL,
	PRIMARY KEY(`note_id`, `id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "todos_position_nonnegative" CHECK("__new_todos"."position" >= 0),
	CONSTRAINT "todos_done_boolean" CHECK("__new_todos"."done" IN (0, 1))
);
--> statement-breakpoint
INSERT INTO `__new_todos`("id", "note_id", "position", "text", "done") SELECT "id", "note_id", "position", "text", "done" FROM `todos`;--> statement-breakpoint
DROP TABLE `todos`;--> statement-breakpoint
ALTER TABLE `__new_todos` RENAME TO `todos`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `todos_note_position` ON `todos` (`note_id`,`position`);--> statement-breakpoint
CREATE TABLE `__new_drafts` (
	`key` text PRIMARY KEY NOT NULL,
	`base_version` integer,
	`payload` text NOT NULL,
	`saved_at` integer NOT NULL,
	`note_id` text GENERATED ALWAYS AS (nullif("key", 'new')) VIRTUAL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "drafts_base_version" CHECK(("__new_drafts"."key" = 'new' AND "__new_drafts"."base_version" IS NULL) OR ("__new_drafts"."key" <> 'new' AND "__new_drafts"."base_version" IS NOT NULL AND "__new_drafts"."base_version" > 0))
);
--> statement-breakpoint
INSERT INTO `__new_drafts`("key", "base_version", "payload", "saved_at") SELECT "key", "base_version", "payload", "saved_at" FROM `drafts`;--> statement-breakpoint
DROP TABLE `drafts`;--> statement-breakpoint
ALTER TABLE `__new_drafts` RENAME TO `drafts`;--> statement-breakpoint
CREATE INDEX `drafts_note` ON `drafts` (`note_id`);--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer NOT NULL,
	CONSTRAINT "notes_positive_version" CHECK("__new_notes"."version" >= 1)
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "title", "created_at", "updated_at", "version") SELECT "id", "title", "created_at", "updated_at", "version" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
CREATE INDEX `notes_updated_at` ON `notes` (`updated_at`);--> statement-breakpoint
CREATE TEMP TABLE `migration_fk_check` (`violations` integer NOT NULL CHECK (`violations` = 0));--> statement-breakpoint
INSERT INTO `migration_fk_check` SELECT count(*) FROM pragma_foreign_key_check;--> statement-breakpoint
DROP TABLE `migration_fk_check`;
