ALTER TABLE `jobs` ADD `workDateTimeTbd` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `workDate` varchar(10);--> statement-breakpoint
ALTER TABLE `jobs` ADD `workStartTime` varchar(5);--> statement-breakpoint
ALTER TABLE `jobs` ADD `workEndTime` varchar(5);