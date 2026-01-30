import { useState, useCallback, useEffect } from 'react';
import { Participant, Prize, Winner } from '@/lib/types';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';

// 使用加密安全的随机数生成器
const secureRandom = (max: number) => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

export function useLottery() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedParticipants, loadedPrizes, loadedWinners] = await Promise.all([
          db.getAllParticipants(),
          db.getAllPrizes(),
          db.getAllWinners()
        ]);
        
        setParticipants(loadedParticipants);
        setPrizes(loadedPrizes);
        setWinners(loadedWinners);
      } catch (error) {
        console.error('Failed to load data from DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const importParticipants = useCallback(async (data: { name: string; department?: string }[]) => {
    const newParticipants = data.map(p => ({
      id: nanoid(),
      name: p.name,
      department: p.department,
      isWinner: false
    }));
    
    // 批量保存到 DB
    for (const p of newParticipants) {
      await db.addParticipant(p);
    }
    
    setParticipants(prev => [...prev, ...newParticipants]);
  }, []);

  const importPrizes = useCallback(async (data: { name: string; count: number; image?: string }[]) => {
    const newPrizes = data.map(p => ({
      id: nanoid(),
      name: p.name,
      count: p.count,
      remaining: p.count,
      image: p.image
    }));
    
    // 批量保存到 DB
    for (const p of newPrizes) {
      await db.addPrize(p);
    }
    
    setPrizes(prev => [...prev, ...newPrizes]);
  }, []);

  const addPrize = useCallback(async (prize: Omit<Prize, 'id' | 'remaining'>) => {
    const newPrize: Prize = {
      ...prize,
      id: nanoid(),
      remaining: prize.count
    };
    await db.addPrize(newPrize);
    setPrizes(prev => [...prev, newPrize]);
  }, []);

  const deletePrize = useCallback(async (id: string) => {
    await db.deletePrize(id);
    setPrizes(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetLottery = useCallback(async () => {
    if (confirm('确定要重置所有抽奖数据吗？这将清空所有中奖记录。')) {
      await db.clearWinners();
      
      // 重置参与者状态
      const updatedParticipants = participants.map(p => ({ ...p, isWinner: false }));
      await db.clearParticipants();
      for (const p of updatedParticipants) {
        await db.addParticipant(p);
      }
      
      // 重置奖品剩余数量
      const updatedPrizes = prizes.map(p => ({ ...p, remaining: p.count }));
      await db.clearPrizes();
      for (const p of updatedPrizes) {
        await db.addPrize(p);
      }

      setWinners([]);
      setParticipants(updatedParticipants);
      setPrizes(updatedPrizes);
    }
  }, [participants, prizes]);

  const draw = useCallback(async (prizeId: string, count: number = 1) => {
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize || prize.remaining <= 0) return null;

    const eligibleParticipants = participants.filter(p => !p.isWinner);
    if (eligibleParticipants.length === 0) return null;

    const drawCount = Math.min(count, prize.remaining, eligibleParticipants.length);
    const newWinners: Winner[] = [];
    const winningParticipantIds = new Set<string>();

    for (let i = 0; i < drawCount; i++) {
      const currentPool = eligibleParticipants.filter(p => !winningParticipantIds.has(p.id));
      if (currentPool.length === 0) break;

      const randomIndex = secureRandom(currentPool.length);
      const winner = currentPool[randomIndex];
      
      winningParticipantIds.add(winner.id);
      newWinners.push({
        id: nanoid(),
        participantId: winner.id,
        participantName: winner.name,
        prizeId: prize.id,
        prizeName: prize.name,
        timestamp: Date.now()
      });
    }

    // 更新 DB
    for (const winner of newWinners) {
      await db.addWinner(winner);
    }
    
    const updatedParticipants = participants.map(p => 
      winningParticipantIds.has(p.id) ? { ...p, isWinner: true } : p
    );
    for (const p of updatedParticipants) {
      if (winningParticipantIds.has(p.id)) {
        await db.addParticipant(p);
      }
    }

    const updatedPrizes = prizes.map(p => 
      p.id === prizeId ? { ...p, remaining: p.remaining - newWinners.length } : p
    );
    const updatedPrize = updatedPrizes.find(p => p.id === prizeId);
    if (updatedPrize) {
      await db.addPrize(updatedPrize);
    }

    // 更新状态
    setWinners(prev => [...prev, ...newWinners]);
    setParticipants(updatedParticipants);
    setPrizes(updatedPrizes);

    return newWinners;
  }, [participants, prizes]);

  return {
    participants,
    prizes,
    winners,
    isDrawing,
    isLoading,
    setIsDrawing,
    importParticipants,
    importPrizes,
    addPrize,
    deletePrize,
    resetLottery,
    draw
  };
}
