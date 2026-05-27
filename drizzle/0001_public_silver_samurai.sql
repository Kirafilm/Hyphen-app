CREATE TABLE `job_skills` (
	`jobId` varchar(36) NOT NULL,
	`skill` varchar(255) NOT NULL,
	CONSTRAINT `job_skills_jobId_skill_pk` PRIMARY KEY(`jobId`,`skill`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(128) NOT NULL,
	`budgetMin` int NOT NULL,
	`budgetMax` int NOT NULL,
	`currency` varchar(16) NOT NULL,
	`location` varchar(128) NOT NULL,
	`timeline` varchar(64) NOT NULL DEFAULT '未指定',
	`clientName` varchar(128) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(64),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`removedAt` timestamp,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`userId` int NOT NULL,
	`plan` enum('none','monthly','yearly') NOT NULL DEFAULT 'none',
	`expiresAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `job_skills` ADD CONSTRAINT `job_skills_jobId_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;