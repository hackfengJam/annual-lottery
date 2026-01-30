import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

/**
 * 新的抽奖数据 Hook，基于云端 API
 * 替代原来基于 IndexedDB 的 useLottery
 */
export function useLotteryData() {
  const utils = trpc.useUtils();
  
  // 查询数据
  const { data: prizes = [], isLoading: prizesLoading } = trpc.prize.list.useQuery();
  const { data: participants = [], isLoading: participantsLoading } = trpc.participant.list.useQuery();
  const { data: winners = [], isLoading: winnersLoading } = trpc.winner.list.useQuery();
  
  // 奖品操作
  const createPrizeMutation = trpc.prize.create.useMutation({
    onSuccess: () => {
      utils.prize.list.invalidate();
    },
  });
  
  const updatePrizeMutation = trpc.prize.update.useMutation({
    onSuccess: () => {
      utils.prize.list.invalidate();
    },
  });
  
  const deletePrizeMutation = trpc.prize.delete.useMutation({
    onSuccess: () => {
      utils.prize.list.invalidate();
    },
  });
  
  const createPrizesBatchMutation = trpc.prize.createBatch.useMutation({
    onSuccess: () => {
      utils.prize.list.invalidate();
    },
  });
  
  // 参与者操作
  const createParticipantMutation = trpc.participant.create.useMutation({
    onSuccess: () => {
      utils.participant.list.invalidate();
    },
  });
  
  const createParticipantsBatchMutation = trpc.participant.createBatch.useMutation({
    onSuccess: () => {
      utils.participant.list.invalidate();
    },
  });
  
  const deleteParticipantMutation = trpc.participant.delete.useMutation({
    onSuccess: () => {
      utils.participant.list.invalidate();
    },
  });
  
  const deleteAllParticipantsMutation = trpc.participant.deleteAll.useMutation({
    onSuccess: () => {
      utils.participant.list.invalidate();
    },
  });
  
  // 中奖记录操作
  const createWinnerMutation = trpc.winner.create.useMutation({
    onSuccess: () => {
      utils.winner.list.invalidate();
      utils.prize.list.invalidate(); // 刷新奖品列表（剩余数量会变化）
    },
  });
  
  const deleteAllWinnersMutation = trpc.winner.deleteAll.useMutation({
    onSuccess: () => {
      utils.winner.list.invalidate();
    },
  });
  
  // 系统操作
  const resetLotteryMutation = trpc.lottery.resetLottery.useMutation({
    onSuccess: () => {
      utils.winner.list.invalidate();
      utils.prize.list.invalidate();
    },
  });
  
  const clearAllMutation = trpc.lottery.clearAll.useMutation({
    onSuccess: () => {
      utils.prize.list.invalidate();
      utils.participant.list.invalidate();
      utils.winner.list.invalidate();
    },
  });
  
  // 封装的便捷方法
  const addPrize = useCallback(async (name: string, count: number, imageBase64?: string) => {
    return await createPrizeMutation.mutateAsync({
      name,
      totalCount: count,
      imageBase64,
    });
  }, [createPrizeMutation]);
  
  const addParticipants = useCallback(async (names: string[]) => {
    return await createParticipantsBatchMutation.mutateAsync({ names });
  }, [createParticipantsBatchMutation]);
  
  const addPrizesBatch = useCallback(async (prizes: Array<{name: string, count: number}>) => {
    return await createPrizesBatchMutation.mutateAsync({ prizes });
  }, [createPrizesBatchMutation]);
  
  const draw = useCallback(async (prizeId: number, prizeName: string, participantId: number, participantName: string) => {
    return await createWinnerMutation.mutateAsync({
      prizeId,
      prizeName,
      participantId,
      participantName,
    });
  }, [createWinnerMutation]);
  
  const resetLottery = useCallback(async () => {
    if (confirm('确定要重置抽奖状态吗？这将清空所有中奖记录，但保留名单和奖品。')) {
      await resetLotteryMutation.mutateAsync();
    }
  }, [resetLotteryMutation]);
  
  const clearAll = useCallback(async () => {
    if (confirm('确定要清空所有数据吗？这将删除所有奖品、名单和中奖记录，且无法恢复！')) {
      await clearAllMutation.mutateAsync();
    }
  }, [clearAllMutation]);
  
  return {
    // 数据
    prizes,
    participants,
    winners,
    
    // 加载状态
    isLoading: prizesLoading || participantsLoading || winnersLoading,
    
    // 奖品操作
    addPrize,
    addPrizesBatch,
    updatePrize: updatePrizeMutation.mutateAsync,
    deletePrize: (id: number) => deletePrizeMutation.mutateAsync({ id }),
    
    // 参与者操作
    addParticipants,
    deleteParticipant: (id: number) => deleteParticipantMutation.mutateAsync({ id }),
    deleteAllParticipants: deleteAllParticipantsMutation.mutateAsync,
    
    // 抽奖操作
    draw,
    
    // 系统操作
    resetLottery,
    clearAll,
  };
}
