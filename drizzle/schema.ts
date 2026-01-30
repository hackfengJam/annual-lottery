import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 奖品表
 * 存储所有奖品的信息，包括名称、数量、图片等
 */
export const prizes = mysqlTable("prizes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** 奖品总数量 */
  totalCount: int("totalCount").notNull(),
  /** 奖品剩余数量 */
  remainingCount: int("remainingCount").notNull(),
  /** 奖品图片的 S3 URL */
  imageUrl: text("imageUrl"),
  /** 奖品图片的 S3 key，用于删除 */
  imageKey: varchar("imageKey", { length: 512 }),
  /** 创建者的 user id */
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prize = typeof prizes.$inferSelect;
export type InsertPrize = typeof prizes.$inferInsert;

/**
 * 参与者表
 * 存储所有参与抽奖的人员信息
 */
export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** 创建者的 user id */
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

/**
 * 中奖记录表
 * 存储所有的中奖记录
 */
export const winners = mysqlTable("winners", {
  id: int("id").autoincrement().primaryKey(),
  /** 中奖者 ID */
  participantId: int("participantId").notNull(),
  /** 中奖者姓名（冗余字段，方便查询） */
  participantName: varchar("participantName", { length: 255 }).notNull(),
  /** 奖品 ID */
  prizeId: int("prizeId").notNull(),
  /** 奖品名称（冗余字段，方便查询） */
  prizeName: varchar("prizeName", { length: 255 }).notNull(),
  /** 创建者的 user id */
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Winner = typeof winners.$inferSelect;
export type InsertWinner = typeof winners.$inferInsert;