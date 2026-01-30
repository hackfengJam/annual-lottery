import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, prizes, participants, winners, InsertPrize, InsertParticipant, InsertWinner, Prize, Participant, Winner } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== 奖品相关查询 ==========

export async function getPrizesByUserId(userId: number): Promise<Prize[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(prizes).where(eq(prizes.userId, userId));
}

export async function createPrize(prize: InsertPrize): Promise<Prize> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(prizes).values(prize);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(prizes).where(eq(prizes.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function updatePrize(id: number, userId: number, data: Partial<InsertPrize>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(prizes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(prizes.id, id), eq(prizes.userId, userId)));
}

export async function deletePrize(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(prizes).where(and(eq(prizes.id, id), eq(prizes.userId, userId)));
}

// ========== 参与者相关查询 ==========

export async function getParticipantsByUserId(userId: number): Promise<Participant[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(participants).where(eq(participants.userId, userId));
}

export async function createParticipant(participant: InsertParticipant): Promise<Participant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(participants).values(participant);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(participants).where(eq(participants.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function createParticipantsBatch(participantList: InsertParticipant[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (participantList.length === 0) return;
  
  await db.insert(participants).values(participantList);
}

export async function deleteParticipant(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(participants).where(and(eq(participants.id, id), eq(participants.userId, userId)));
}

export async function deleteAllParticipants(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(participants).where(eq(participants.userId, userId));
}

// ========== 中奖记录相关查询 ==========

export async function getWinnersByUserId(userId: number): Promise<Winner[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(winners).where(eq(winners.userId, userId));
}

export async function createWinner(winner: InsertWinner): Promise<Winner> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(winners).values(winner);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(winners).where(eq(winners.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function deleteAllWinners(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(winners).where(eq(winners.userId, userId));
}

export async function resetPrizeCounts(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 将所有奖品的剩余数量重置为总数量
  const userPrizes = await getPrizesByUserId(userId);
  
  for (const prize of userPrizes) {
    await db.update(prizes)
      .set({ remainingCount: prize.totalCount, updatedAt: new Date() })
      .where(eq(prizes.id, prize.id));
  }
}
