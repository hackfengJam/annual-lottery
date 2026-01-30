import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';
import type { InsertPrize, InsertParticipant } from '../drizzle/schema';

describe('Batch Add and Deduplication Tests', () => {
  let testUserId: number;
  let createdPrizeIds: number[] = [];
  let createdParticipantIds: number[] = [];

  beforeAll(async () => {
    // 使用固定的测试用户 ID
    testUserId = 1;
  });

  afterAll(async () => {
    // 清理测试数据
    for (const id of createdPrizeIds) {
      await db.deletePrize(id, testUserId);
    }
    for (const id of createdParticipantIds) {
      await db.deleteParticipant(id, testUserId);
    }
  });

  describe('Prize Batch Creation with Deduplication', () => {
    it('should create multiple prizes at once', async () => {
      const prizes: InsertPrize[] = [
        { name: '批量测试奖品1', totalCount: 5, remainingCount: 5, userId: testUserId },
        { name: '批量测试奖品2', totalCount: 10, remainingCount: 10, userId: testUserId },
        { name: '批量测试奖品3', totalCount: 3, remainingCount: 3, userId: testUserId },
      ];

      for (const prize of prizes) {
        const created = await db.createPrize(prize);
        createdPrizeIds.push(created.id);
      }

      const allPrizes = await db.getPrizesByUserId(testUserId);
      const testPrizes = allPrizes.filter(p => p.name.startsWith('批量测试奖品'));
      
      expect(testPrizes.length).toBeGreaterThanOrEqual(3);
    });

    it('should deduplicate prizes by name', async () => {
      const existingPrizes = await db.getPrizesByUserId(testUserId);
      const existingNames = new Set(existingPrizes.map(p => p.name.trim()));

      const newPrizes = [
        { name: '批量测试奖品1', count: 5 }, // 重复
        { name: '批量测试奖品4', count: 2 }, // 新的
        { name: '批量测试奖品2', count: 8 }, // 重复
        { name: '批量测试奖品5', count: 1 }, // 新的
      ];

      // 模拟去重逻辑
      const uniquePrizes = newPrizes.filter(p => !existingNames.has(p.name.trim()));
      
      expect(uniquePrizes.length).toBe(2);
      expect(uniquePrizes.map(p => p.name)).toEqual(['批量测试奖品4', '批量测试奖品5']);

      // 实际创建去重后的奖品
      for (const prize of uniquePrizes) {
        const created = await db.createPrize({
          name: prize.name,
          totalCount: prize.count,
          remainingCount: prize.count,
          userId: testUserId,
        });
        createdPrizeIds.push(created.id);
      }
    });

    it('should handle duplicate names in input array', async () => {
      const inputPrizes = [
        { name: '重复测试奖品', count: 5 },
        { name: '重复测试奖品', count: 10 }, // 输入中重复
        { name: '唯一测试奖品', count: 3 },
      ];

      // 模拟输入去重逻辑
      const seenNames = new Set<string>();
      const uniqueInput = inputPrizes.filter(p => {
        const trimmed = p.name.trim();
        if (seenNames.has(trimmed)) return false;
        seenNames.add(trimmed);
        return true;
      });

      expect(uniqueInput.length).toBe(2);
      expect(uniqueInput.map(p => p.name)).toEqual(['重复测试奖品', '唯一测试奖品']);

      // 创建去重后的奖品
      for (const prize of uniqueInput) {
        const created = await db.createPrize({
          name: prize.name,
          totalCount: prize.count,
          remainingCount: prize.count,
          userId: testUserId,
        });
        createdPrizeIds.push(created.id);
      }
    });
  });

  describe('Participant Batch Creation with Deduplication', () => {
    it('should create multiple participants at once', async () => {
      const participants: InsertParticipant[] = [
        { name: '批量测试参与者1', userId: testUserId },
        { name: '批量测试参与者2', userId: testUserId },
        { name: '批量测试参与者3', userId: testUserId },
      ];

      await db.createParticipantsBatch(participants);

      const allParticipants = await db.getParticipantsByUserId(testUserId);
      const testParticipants = allParticipants.filter(p => p.name.startsWith('批量测试参与者'));
      
      expect(testParticipants.length).toBeGreaterThanOrEqual(3);
      createdParticipantIds.push(...testParticipants.map(p => p.id));
    });

    it('should deduplicate participants by name', async () => {
      const existingParticipants = await db.getParticipantsByUserId(testUserId);
      const existingNames = new Set(existingParticipants.map(p => p.name.trim()));

      const newNames = [
        '批量测试参与者1', // 重复
        '批量测试参与者4', // 新的
        '批量测试参与者2', // 重复
        '批量测试参与者5', // 新的
      ];

      // 模拟去重逻辑
      const uniqueNames = newNames.filter(name => !existingNames.has(name.trim()));
      
      expect(uniqueNames.length).toBe(2);
      expect(uniqueNames).toEqual(['批量测试参与者4', '批量测试参与者5']);

      // 实际创建去重后的参与者
      const participants = uniqueNames.map(name => ({ name, userId: testUserId }));
      await db.createParticipantsBatch(participants);

      const updated = await db.getParticipantsByUserId(testUserId);
      const newParticipants = updated.filter(p => uniqueNames.includes(p.name));
      createdParticipantIds.push(...newParticipants.map(p => p.id));
    });

    it('should handle duplicate names in input array', async () => {
      const inputNames = [
        '重复测试参与者',
        '重复测试参与者', // 输入中重复
        '唯一测试参与者',
      ];

      // 模拟输入去重逻辑
      const uniqueNames = Array.from(new Set(inputNames.map(n => n.trim())));

      expect(uniqueNames.length).toBe(2);
      expect(uniqueNames).toEqual(['重复测试参与者', '唯一测试参与者']);

      // 创建去重后的参与者
      const participants = uniqueNames.map(name => ({ name, userId: testUserId }));
      await db.createParticipantsBatch(participants);

      const updated = await db.getParticipantsByUserId(testUserId);
      const newParticipants = updated.filter(p => uniqueNames.includes(p.name));
      createdParticipantIds.push(...newParticipants.map(p => p.id));
    });

    it('should trim whitespace when deduplicating', async () => {
      const inputNames = [
        '  空格测试参与者  ',
        '空格测试参与者', // 去除空格后重复
        ' 另一个参与者 ',
      ];

      // 模拟去重逻辑（带 trim）
      const trimmedNames = inputNames.map(n => n.trim());
      const uniqueNames = Array.from(new Set(trimmedNames));

      expect(uniqueNames.length).toBe(2);
      expect(uniqueNames).toEqual(['空格测试参与者', '另一个参与者']);

      // 创建去重后的参与者
      const participants = uniqueNames.map(name => ({ name, userId: testUserId }));
      await db.createParticipantsBatch(participants);

      const updated = await db.getParticipantsByUserId(testUserId);
      const newParticipants = updated.filter(p => uniqueNames.includes(p.name));
      createdParticipantIds.push(...newParticipants.map(p => p.id));
    });
  });
});
