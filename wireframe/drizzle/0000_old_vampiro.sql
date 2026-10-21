CREATE TABLE `guest_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`digest` text NOT NULL,
	`email` text NOT NULL,
	`expires` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`sent` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guest_sessions` (
	`digest` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`email` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`attempts` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
