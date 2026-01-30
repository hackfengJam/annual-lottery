import { useState, useCallback, useEffect } from 'react';
import { Participant, Prize, Winner } from '@/lib/types';
import { nanoid } from 'nanoid';

// 使用加密安全的随机数生成器
const secureRandom = (max: number) => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

export function useLottery() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem('lottery_participants');
    return saved ? JSON.parse(saved) : [];
  });

  const [prizes, setPrizes] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('lottery_prizes');
    return saved ? JSON.parse(saved) : [];
  });

  const [winners, setWinners] = useState<Winner[]>(() => {
    const saved = localStorage.getItem('lottery_winners');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDrawing, setIsDrawing] = useState(false);

  // 持久化数据
  useEffect(() => {
    localStorage.setItem('lottery_participants', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('lottery_prizes', JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem('lottery_winners', JSON.stringify(winners));
  }, [winners]);

  const importParticipants = useCallback((data: { name: string; department?: string }[]) => {
    const newParticipants = data.map(p => ({
      id: nanoid(),
      name: p.name,
      department: p.department,
      isWinner: false
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
  }, []);

  const importPrizes = useCallback((data: { name: string; count: number; image?: string }[]) => {
    const newPrizes = data.map(p => ({
      id: nanoid(),
      name: p.name,
      count: p.count,
      remaining: p.count,
      image: p.image
    }));
    setPrizes(prev => [...prev, ...newPrizes]);
  }, []);

  const resetLottery = useCallback(() => {
    if (confirm('确定要重置所有抽奖数据吗？这将清空所有中奖记录。')) {
      setWinners([]);
      setParticipants(prev => prev.map(p => ({ ...p, isWinner: false })));
      setPrizes(prev => prev.map(p => ({ ...p, remaining: p.count })));
    }
  }, []);

  const draw = useCallback((prizeId: string, count: number = 1) => {
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize || prize.remaining <= 0) return null;

    const eligibleParticipants = participants.filter(p => !p.isWinner);
    if (eligibleParticipants.length === 0) return null;

    const drawCount = Math.min(count, prize.remaining, eligibleParticipants.length);
    const newWinners: Winner[] = [];
    const winningParticipantIds = new Set<string>();

    for (let i = 0; i < drawCount; i++) {
      // 每次抽取前重新计算剩余的合格参与者（排除本轮已中奖的）
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

    // 更新状态
    setWinners(prev => [...prev, ...newWinners]);
    setParticipants(prev => prev.map(p => 
      winningParticipantIds.has(p.id) ? { ...p, isWinner: true } : p
    ));
    setPrizes(prev => prev.map(p => 
      p.id === prizeId ? { ...p, remaining: p.remaining - newWinners.length } : p
    ));

    return newWinners;
  }, [participants, prizes]);

  return {
    participants,
    prizes,
    winners,
    isDrawing,
    setIsDrawing,
    importParticipants,
    importPrizes,
    resetLottery,
    draw
  };
}
