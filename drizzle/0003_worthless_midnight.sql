ALTER TABLE `jobs` ADD `workDateTbd` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `workTimeTbd` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `contactPerson` varchar(128);