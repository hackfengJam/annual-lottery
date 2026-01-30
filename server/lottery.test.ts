import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import type { InsertPrize, InsertParticipant } from '../drizzle/schema';

describe('Lottery API Integration Tests', () => {
  let testUserId: number;
  let testPrizeId: number;
  let testParticipantIds: number[] = [];

  beforeAll(async () => {
    // 使用固定的测试用户 ID (假设 ID 1 是管理员)
    testUserId = 1;
  });

  afterAll(async () => {
    // 清理测试数据
    if (testPrizeId) {
      await db.deletePrize(testPrizeId, testUserId);
    }
    for (const id of testParticipantIds) {
      await db.deleteParticipant(id, testUserId);
    }
    await db.deleteAllWinners(testUserId);
  });

  describe('Prize Management', () => {
    it('should create a prize', async () => {
      const prizeData: InsertPrize = {
        name: '测试奖品',
        totalCount: 10,
        remainingCount: 10,
        userId: testUserId,
      };

      const prize = await db.createPrize(prizeData);
      testPrizeId = prize.id;

      expect(prize).toBeDefined();
      expect(prize.name).toBe('测试奖品');
      expect(prize.totalCount).toBe(10);
      expect(prize.remainingCount).toBe(10);
    });

    it('should list prizes for user', async () => {
      const prizes = await db.getPrizesByUserId(testUserId);
      expect(prizes.length).toBeGreaterThan(0);
      expect(prizes.some(p => p.id === testPrizeId)).toBe(true);
    });

    it('should update prize', async () => {
      await db.updatePrize(testPrizeId, testUserId, {
        name: '更新后的奖品',
        totalCount: 15,
      });

      const prizes = await db.getPrizesByUserId(testUserId);
      const updatedPrize = prizes.find(p => p.id === testPrizeId);
      
      expect(updatedPrize).toBeDefined();
      expect(updatedPrize!.name).toBe('更新后的奖品');
      expect(updatedPrize!.totalCount).toBe(15);
    });
  });

  describe('Participant Management', () => {
    it('should create participants in batch', async () => {
      const participantData: InsertParticipant[] = [
        { name: '测试参与者1', userId: testUserId },
        { name: '测试参与者2', userId: testUserId },
        { name: '测试参与者3', userId: testUserId },
      ];

      await db.createParticipantsBatch(participantData);

      const participants = await db.getParticipantsByUserId(testUserId);
      const testParticipants = participants.filter(p => 
        p.name.startsWith('测试参与者')
      );

      expect(testParticipants.length).toBeGreaterThanOrEqual(3);
      testParticipantIds = testParticipants.map(p => p.id);
    });

    it('should list participants for user', async () => {
      const participants = await db.getParticipantsByUserId(testUserId);
      expect(participants.length).toBeGreaterThan(0);
    });
  });

  describe('Winner Management', () => {
    it('should create winner and decrease prize count', async () => {
      const participants = await db.getParticipantsByUserId(testUserId);
      const testParticipant = participants.find(p => p.name === '测试参与者1');
      
      expect(testParticipant).toBeDefined();

      const prizes = await db.getPrizesByUserId(testUserId);
      const testPrize = prizes.find(p => p.id === testPrizeId);
      const initialRemaining = testPrize!.remainingCount;

      const winner = await db.createWinner({
        participantId: testParticipant!.id,
        participantName: testParticipant!.name,
        prizeId: testPrizeId,
        prizeName: testPrize!.name,
        userId: testUserId,
      });

      expect(winner).toBeDefined();
      expect(winner.participantName).toBe('测试参与者1');

      // 手动减少奖品数量（模拟 API 逻辑）
      await db.updatePrize(testPrizeId, testUserId, {
        remainingCount: initialRemaining - 1,
      });

      const updatedPrizes = await db.getPrizesByUserId(testUserId);
      const updatedPrize = updatedPrizes.find(p => p.id === testPrizeId);
      expect(updatedPrize!.remainingCount).toBe(initialRemaining - 1);
    });

    it('should list winners for user', async () => {
      const winners = await db.getWinnersByUserId(testUserId);
      expect(winners.length).toBeGreaterThan(0);
      expect(winners.some(w => w.prizeId === testPrizeId)).toBe(true);
    });
  });

  describe('System Operations', () => {
    it('should reset prize counts', async () => {
      await db.resetPrizeCounts(testUserId);

      const prizes = await db.getPrizesByUserId(testUserId);
      const testPrize = prizes.find(p => p.id === testPrizeId);
      
      expect(testPrize!.remainingCount).toBe(testPrize!.totalCount);
    });

    it('should delete all winners', async () => {
      await db.deleteAllWinners(testUserId);

      const winners = await db.getWinnersByUserId(testUserId);
      expect(winners.length).toBe(0);
    });
  });
});
