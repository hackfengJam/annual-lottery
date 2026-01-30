CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`totalCount` int NOT NULL,
	`remainingCount` int NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(512),
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `winners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participantId` int NOT NULL,
	`participantName` varchar(255) NOT NULL,
	`prizeId` int NOT NULL,
	`prizeName` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `winners_id` PRIMARY KEY(`id`)
);
