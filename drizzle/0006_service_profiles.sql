CREATE TABLE `service_profiles` (
  `userId` int NOT NULL,
  `slug` varchar(64) NOT NULL,
  `headline` varchar(255) NOT NULL DEFAULT '',
  `intro` text NOT NULL,
  `serviceInfo` text NOT NULL,
  `skills` text NOT NULL,
  `categories` text NOT NULL,
  `locations` text NOT NULL,
  `isPublished` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `service_profiles_userId` PRIMARY KEY(`userId`),
  CONSTRAINT `service_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `service_profiles_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `service_portfolio_images` (
  `id` varchar(36) NOT NULL,
  `userId` int NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `service_portfolio_images_id` PRIMARY KEY(`id`),
  CONSTRAINT `service_portfolio_images_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);

CREATE TABLE `message_threads` (
  `id` varchar(36) NOT NULL,
  `profileUserId` int NOT NULL,
  `visitorUserId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `message_threads_id` PRIMARY KEY(`id`),
  CONSTRAINT `message_threads_profileUserId_users_id_fk` FOREIGN KEY (`profileUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `message_threads_visitorUserId_users_id_fk` FOREIGN KEY (`visitorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `message_threads_pair_unique` UNIQUE(`profileUserId`, `visitorUserId`)
);

CREATE TABLE `service_messages` (
  `id` varchar(36) NOT NULL,
  `threadId` varchar(36) NOT NULL,
  `senderUserId` int NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `service_messages_id` PRIMARY KEY(`id`),
  CONSTRAINT `service_messages_threadId_message_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `message_threads`(`id`) ON DELETE cascade ON UPDATE no action,
  CONSTRAINT `service_messages_senderUserId_users_id_fk` FOREIGN KEY (`senderUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);
