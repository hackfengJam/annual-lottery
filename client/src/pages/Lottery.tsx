import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLotteryData } from "@/hooks/useLotteryData";
import type { Winner, Participant } from "../../../drizzle/schema";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function Lottery() {
  const { 
    participants, 
    prizes, 
    winners,
    draw 
  } = useLotteryData();
  
  const [isDrawing, setIsDrawing] = useState(false);

  const [selectedPrizeId, setSelectedPrizeId] = useState<number | null>(null);
  const [drawCount, setDrawCount] = useState<string>('1');
  const [currentWinners, setCurrentWinners] = useState<Winner[]>([]);
  const [rollingName, setRollingName] = useState<string>('READY');
  const [countdown, setCountdown] = useState<number>(10); // 倒计时秒数
  
  // 存储预选的中奖者（在开始抽奖时确定）
  const preSelectedWinnersRef = useRef<Participant[]>([]);
  const rollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rollingIndexRef = useRef<number>(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 自动选择第一个有剩余的奖品
  useEffect(() => {
    if (!selectedPrizeId && prizes.length > 0) {
      const firstAvailable = prizes.find(p => p.remainingCount > 0);
      if (firstAvailable) setSelectedPrizeId(firstAvailable.id);
    }
  }, [prizes, selectedPrizeId]);

  // 获取已中奖的参与者 ID 集合
  const winnerParticipantIds = new Set(winners.map(w => w.participantId));

  const startRolling = () => {
    if (!selectedPrizeId) return;
    
    const selectedPrize = prizes.find(p => p.id === selectedPrizeId);
    if (!selectedPrize) return;

    setIsDrawing(true);
    setCurrentWinners([]);
    setCountdown(10); // 重置倒计时为10秒
    
    // 获取未中奖的参与者
    const eligibleParticipants = participants.filter(p => !winnerParticipantIds.has(p.id));
      
    if (eligibleParticipants.length === 0) {
      setIsDrawing(false);
      toast.error('没有可抽奖的参与者');
      return;
    }

    // 计算实际抽取数量
    const count = drawCount === 'ALL' 
      ? selectedPrize.remainingCount
      : parseInt(drawCount);
    const actualCount = Math.min(count, eligibleParticipants.length, selectedPrize.remainingCount);
    
    // 【关键修复】在开始抽奖时就确定中奖者
    // 使用密码学安全的随机算法抽取中奖者
    const shuffled = [...eligibleParticipants].sort(() => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 0xFFFFFFFF - 0.5;
    });
    
    preSelectedWinnersRef.current = shuffled.slice(0, actualCount);
    rollingIndexRef.current = 0;

    // 滚动动画逻辑
    const allNames = eligibleParticipants.map(p => p.name);
    const startTime = Date.now();
    let lastUpdateTime = startTime;
    let speed = 50;
    const totalDuration = 10000; // 10秒滚动时间（与倒计时同步）
    
    const animate = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      const timeSinceLastUpdate = now - lastUpdateTime;
      
      if (timeSinceLastUpdate > speed) {
        // 在前80%的时间随机显示名字，后20%逐渐减速并显示预选的中奖者
        if (elapsedTime < totalDuration * 0.8) {
          const randomName = allNames[Math.floor(Math.random() * allNames.length)];
          setRollingName(randomName);
        } else {
          // 逐渐减速并循环显示预选中奖者的名字
          speed = Math.min(speed * 1.1, 300); // 逐渐减速
          if (preSelectedWinnersRef.current.length > 0) {
            const currentWinner = preSelectedWinnersRef.current[rollingIndexRef.current % preSelectedWinnersRef.current.length];
            setRollingName(currentWinner.name);
            rollingIndexRef.current++;
          }
        }
        lastUpdateTime = now;
      }
      
      rollingIntervalRef.current = requestAnimationFrame(animate) as any;
    };
    
    rollingIntervalRef.current = requestAnimationFrame(animate) as any;

    // 启动倒计时
    let remainingTime = 10;
    countdownTimerRef.current = setInterval(() => {
      remainingTime--;
      setCountdown(remainingTime);
      
      if (remainingTime <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    }, 1000);

    // 10秒后自动停止
    autoStopTimeoutRef.current = setTimeout(() => {
      stopRolling();
    }, 10000);
  };

  const stopRolling = async () => {
    // 清理所有定时器
    if (rollingIntervalRef.current) {
      cancelAnimationFrame(rollingIntervalRef.current as any);
      rollingIntervalRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    if (!selectedPrizeId) return;

    const selectedPrize = prizes.find(p => p.id === selectedPrizeId);
    if (!selectedPrize) return;

    // 【关键修复】使用预选的中奖者，而不是重新随机
    const selectedWinners = preSelectedWinnersRef.current;
    
    if (selectedWinners.length === 0) {
      toast.error('没有可抽奖的参与者');
      setIsDrawing(false);
      return;
    }

    // 显示最后一个预选中奖者的名字（作为停止时的最终显示）
    if (selectedWinners.length === 1) {
      setRollingName(selectedWinners[0].name);
    }
    
    // 调用 API 记录中奖
    const newWinners: Winner[] = [];
    for (const participant of selectedWinners) {
      try {
        const winner = await draw(
          selectedPrize.id,
          selectedPrize.name,
          participant.id,
          participant.name
        );
        newWinners.push(winner);
      } catch (error) {
        console.error('Failed to record winner:', error);
        toast.error(`记录中奖者 ${participant.name} 失败`);
      }
    }
    
    if (newWinners.length > 0) {
      setCurrentWinners(newWinners);
      // 触发庆祝特效
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF00FF', '#00FFFF', '#BF00FF']
      });
      toast.success(`成功抽取 ${newWinners.length} 位中奖者`);
    }
    
    setIsDrawing(false);
    preSelectedWinnersRef.current = []; // 清空预选中奖者
    setCountdown(10); // 重置倒计时显示
  };

  const toggleDraw = () => {
    if (isDrawing) {
      stopRolling();
    } else {
      startRolling();
    }
  };

  const selectedPrize = prizes.find(p => p.id === selectedPrizeId);

  return (
    <div className="container py-8 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-12">
      
      {/* 奖品选择区 */}
      <div className="w-full max-w-4xl flex gap-4 z-10">
        <Select value={selectedPrizeId?.toString() || ''} onValueChange={(val) => setSelectedPrizeId(parseInt(val))} disabled={isDrawing}>
          <SelectTrigger className="h-16 text-2xl bg-black/50 border-2 border-cyan-500 text-cyan-400 neon-border-blue">
            <SelectValue placeholder="选择奖项" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-cyan-500 text-cyan-400">
            {prizes.map(prize => (
              <SelectItem key={prize.id} value={prize.id.toString()} disabled={prize.remainingCount === 0} className="text-xl py-3">
                {prize.name} (剩余: {prize.remainingCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={drawCount} onValueChange={setDrawCount} disabled={isDrawing}>
          <SelectTrigger className="w-[200px] h-16 text-2xl bg-black/50 border-2 border-pink-500 text-pink-400 neon-border-pink">
            <SelectValue placeholder="数量" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-pink-500 text-pink-400">
            {[1, 3, 5, 10].map(num => (
              <SelectItem key={num} value={num.toString()} className="text-xl py-3">
                抽取 {num} 个
              </SelectItem>
            ))}
            <SelectItem value="ALL" className="text-xl py-3 text-red-400 font-bold">
              全部抽取 ({selectedPrize?.remainingCount || 0})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 主展示区 */}
      <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center">
        {/* 装饰边框 */}
        <div className="absolute inset-0 pointer-events-none">
          <img src="/images/cyberpunk-card-border.png" alt="" className="w-full h-full object-fill opacity-80" />
        </div>

        {/* 倒计时显示 */}
        {isDrawing && (
          <div className="absolute top-4 right-4 z-20">
            <motion.div 
              className="text-6xl font-display font-bold text-yellow-400 neon-text-yellow"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {countdown}s
            </motion.div>
          </div>
        )}

        {/* 滚动/结果显示 */}
        <div className="relative z-10 text-center space-y-8 w-full px-8">
          {isDrawing ? (
            <motion.div 
              className="text-8xl font-display font-bold text-white neon-text-blue tracking-widest"
              animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.2, repeat: Infinity }}
            >
              {rollingName}
            </motion.div>
          ) : currentWinners.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {currentWinners.map((winner, idx) => (
                  <motion.div
                    key={winner.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.05, 1), type: "spring" }}
                    className="bg-black/60 border border-pink-500 p-4 rounded-lg neon-border-pink flex flex-col items-center justify-center"
                  >
                    <div className="text-2xl font-bold text-pink-400 truncate w-full text-center">{winner.participantName}</div>
                    <div className="text-sm text-cyan-300">#{winner.participantId}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-8">
              {selectedPrize ? (
                <>
                  {/* 奖品图片 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="relative w-80 h-80 rounded-xl overflow-hidden border-4 border-cyan-500 neon-border-blue bg-black/50 shadow-2xl"
                  >
                    {selectedPrize.imageUrl ? (
                      <img 
                        src={selectedPrize.imageUrl} 
                        alt={selectedPrize.name} 
                        className="w-full h-full object-contain p-6"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-9xl">🎁</span>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* 奖品名称 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-2"
                  >
                    <div className="text-5xl font-display font-bold text-pink-400 neon-text-pink">
                      {selectedPrize.name}
                    </div>
                    <div className="text-2xl text-cyan-400">
                      剩余数量: {selectedPrize.remainingCount}
                    </div>
                  </motion.div>
                  
                  <div className="text-4xl font-display text-white/70 tracking-widest animate-pulse">
                    点击 START 开始抽奖
                  </div>
                </>
              ) : (
                <div className="text-6xl font-display text-white/50 tracking-widest">
                  请选择奖项
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 控制按钮 */}
      <Button 
        size="lg"
        onClick={toggleDraw}
        disabled={!selectedPrize || selectedPrize.remainingCount === 0}
        className={cn(
          "h-24 px-24 text-4xl font-display font-bold tracking-widest transition-all duration-300 transform hover:scale-105",
          isDrawing 
            ? "bg-red-600 hover:bg-red-700 neon-border-pink animate-pulse" 
            : "bg-cyan-600 hover:bg-cyan-700 neon-border-blue"
        )}
      >
        {isDrawing ? "STOP" : "START"}
      </Button>

      {/* 当前奖项中奖名单 */}
      {selectedPrize && winners.filter(w => w.prizeId === selectedPrizeId).length > 0 && (
        <div className="w-full max-w-4xl mt-8">
          <h3 className="text-2xl font-display text-center mb-4 neon-text-pink">
            {selectedPrize.name} 中奖名单
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {winners
              .filter(w => w.prizeId === selectedPrizeId)
              .map(winner => (
                <div key={winner.id} className="bg-black/40 border border-cyan-500/30 p-2 text-center rounded">
                  <span className="text-cyan-300 font-bold">{winner.participantName}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* 完整获奖名单公示区域 */}
      {winners.length > 0 && (
        <div className="w-full max-w-7xl mt-16 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-display font-bold neon-text-pink mb-2">获奖名单公示</h2>
            <p className="text-cyan-400 text-xl">恭喜以下幸运儿获得奖品！</p>
          </div>
          
          <div className="space-y-8">
            {prizes
              .filter(prize => winners.some(w => w.prizeId === prize.id))
              .map(prize => {
                const prizeWinners = winners.filter(w => w.prizeId === prize.id);
                return (
                  <motion.div
                    key={prize.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-black/60 border-2 border-cyan-500/50 rounded-xl p-6 neon-border-blue"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 奖品信息 */}
                      <div className="flex-shrink-0">
                        {prize.imageUrl ? (
                          <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-pink-500 neon-border-pink bg-black/50">
                            <img 
                              src={prize.imageUrl} 
                              alt={prize.name} 
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border-2 border-pink-500 neon-border-pink bg-black/50 flex items-center justify-center">
                            <span className="text-4xl">🎁</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 奖品名称和中奖者 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-3xl font-display font-bold text-pink-400 neon-text-pink">
                            {prize.name}
                          </h3>
                          <span className="text-cyan-400 text-xl">
                            共 {prizeWinners.length} 人中奖
                          </span>
                        </div>
                        
                        {/* 中奖者列表 */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {prizeWinners.map((winner, idx) => (
                            <motion.div
                              key={winner.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.02, type: "spring" }}
                              className="bg-gradient-to-br from-cyan-900/30 to-pink-900/30 border border-cyan-400/50 rounded-lg p-3 text-center hover:border-pink-400 transition-colors"
                            >
                              <div className="text-lg font-bold text-white truncate">
                                {winner.participantName}
                              </div>
                              <div className="text-xs text-cyan-300 mt-1">
                                #{winner.participantId}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            }
          </div>
        </div>
      )}

    </div>
  );
}
