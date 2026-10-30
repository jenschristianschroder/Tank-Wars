CREATE TABLE `rooms` (
 `code` text PRIMARY KEY NOT NULL,
 `host` text NOT NULL,
 `guest` text,
 `state` text NOT NULL,
 `version` integer DEFAULT 0 NOT NULL,
 `rematch` text DEFAULT '[]' NOT NULL,
 `expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_expires` ON `rooms` (`expires`);
