CREATE TABLE `push_devices` (
	`expoPushToken` varchar(255) NOT NULL,
	`userId` int,
	`platform` varchar(16),
	`jobAlertsEnabled` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_devices_expoPushToken` PRIMARY KEY(`expoPushToken`)
);
--> statement-breakpoint
ALTER TABLE `push_devices` ADD CONSTRAINT `push_devices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
