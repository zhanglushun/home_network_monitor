CREATE TABLE `bandwidth_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`period_type` enum('daily','monthly') NOT NULL,
	`total_upload` bigint NOT NULL,
	`total_download` bigint NOT NULL,
	`peak_upload_speed` float NOT NULL DEFAULT 0,
	`peak_download_speed` float NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bandwidth_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connection_quality` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`signal_strength` float NOT NULL,
	`connection_stability` float NOT NULL,
	`error_rate` float NOT NULL DEFAULT 0,
	`retransmission_rate` float NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connection_quality_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_latency` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`target` varchar(255) NOT NULL,
	`latency` float NOT NULL,
	`packet_loss` float NOT NULL DEFAULT 0,
	`jitter` float NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_latency_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_traffic` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`upload_speed` float NOT NULL,
	`download_speed` float NOT NULL,
	`total_upload` bigint NOT NULL,
	`total_download` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_traffic_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `online_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mac_address` varchar(64) NOT NULL,
	`ip_address` varchar(64) NOT NULL,
	`hostname` text,
	`device_type` varchar(64),
	`is_online` int NOT NULL DEFAULT 1,
	`last_seen` timestamp NOT NULL DEFAULT (now()),
	`upload_speed` float NOT NULL DEFAULT 0,
	`download_speed` float NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `online_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `router_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`cpu_usage` float NOT NULL,
	`memory_usage` float NOT NULL,
	`memory_total` bigint NOT NULL,
	`memory_used` bigint NOT NULL,
	`temperature` float NOT NULL DEFAULT 0,
	`uptime` bigint NOT NULL,
	`load_average` float NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `router_status_id` PRIMARY KEY(`id`)
);
