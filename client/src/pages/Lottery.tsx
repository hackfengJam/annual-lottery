import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLottery } from "@/hooks/useLottery";
import { Winner } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

export default function Lottery() {
  const { 
    participants, 
    prizes, 
    draw, 
    isDrawing, 
    setIsDrawing 
  } = useLottery();

  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [drawCount, setDrawCount] = useState<string>('1');
  const [currentWinners, setCurrentWinners] = useState<Winner[]>([]);
  const [rollingName, setRollingName] = useState<string>('READY');
  
  const rollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动选择第一个有剩余的奖品
  useEffect(() => {
    if (!selectedPrizeId && prizes.length > 0) {
      const firstAvailable = prizes.find(p => p.remaining > 0);
      if (firstAvailable) setSelectedPrizeId(firstAvailable.id);
    }
  }, [prizes, selectedPrizeId]);

  const startRolling = () => {
    if (!selectedPrizeId) return;
    
    setIsDrawing(true);
    setCurrentWinners([]);
    
    // 滚动动画逻辑
    const eligibleNames = participants.filter(p => !p.isWinner).map(p => p.name);
    if (eligibleNames.length === 0) {
      setIsDrawing(false);
      return;
    }

    // 播放音效（如果有）
    
    // 加速滚动效果
    let speed = 50;
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      if (now - lastTime > speed) {
        const randomName = eligibleNames[Math.floor(Math.random() * eligibleNames.length)];
        setRollingName(randomName);
        lastTime = now;
      }
      
      rollingIntervalRef.current = requestAnimationFrame(animate) as any;
    };
    
    rollingIntervalRef.current = requestAnimationFrame(animate) as any;
  };

  const stopRolling = () => {
    if (rollingIntervalRef.current) {
      cancelAnimationFrame(rollingIntervalRef.current as any);
      rollingIntervalRef.current = null;
    }

    const count = parseInt(drawCount);
    draw(selectedPrizeId, count).then(winners => {
      if (winners) {
        setCurrentWinners(winners);
        // 触发庆祝特效
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF00FF', '#00FFFF', '#BF00FF']
        });
      }
      setIsDrawing(false);
    });
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
        <Select value={selectedPrizeId} onValueChange={setSelectedPrizeId} disabled={isDrawing}>
          <SelectTrigger className="h-16 text-2xl bg-black/50 border-2 border-cyan-500 text-cyan-400 neon-border-blue">
            <SelectValue placeholder="选择奖项" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-cyan-500 text-cyan-400">
            {prizes.map(prize => (
              <SelectItem key={prize.id} value={prize.id} disabled={prize.remaining === 0} className="text-xl py-3">
                {prize.name} (剩余: {prize.remaining})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={drawCount} onValueChange={setDrawCount} disabled={isDrawing}>
          <SelectTrigger className="w-[180px] h-16 text-2xl bg-black/50 border-2 border-pink-500 text-pink-400 neon-border-pink">
            <SelectValue placeholder="数量" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-pink-500 text-pink-400">
            {[1, 3, 5, 10].map(num => (
              <SelectItem key={num} value={num.toString()} className="text-xl py-3">
                抽取 {num} 个
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 主展示区 */}
      <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center">
        {/* 装饰边框 */}
        <div className="absolute inset-0 pointer-events-none">
          <img src="/images/cyberpunk-card-border.png" alt="" className="w-full h-full object-fill opacity-80" />
        </div>

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
            <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
              {currentWinners.map((winner, idx) => (
                <motion.div
                  key={winner.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.1, type: "spring" }}
                  className="bg-black/60 border border-pink-500 p-6 rounded-lg neon-border-pink"
                >
                  <div className="text-4xl font-bold text-pink-400 mb-2">{winner.participantName}</div>
                  <div className="text-xl text-cyan-300">{winner.participantId.slice(0, 4)}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
              {selectedPrize?.image && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative w-64 h-64 rounded-lg overflow-hidden border-2 border-cyan-500 neon-border-blue bg-black/50"
                >
                  <img 
                    src={selectedPrize.image} 
                    alt={selectedPrize.name} 
                    className="w-full h-full object-contain p-4"
                  />
                </motion.div>
              )}
              <div className="text-6xl font-display text-white/50 tracking-widest">
                {selectedPrize ? '等待抽奖' : '请选择奖项'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 控制按钮 */}
      <Button 
        size="lg"
        onClick={toggleDraw}
        disabled={!selectedPrize || selectedPrize.remaining === 0}
        className={cn(
          "h-24 px-24 text-4xl font-display font-bold tracking-widest transition-all duration-300 transform hover:scale-105",
          isDrawing 
            ? "bg-red-600 hover:bg-red-700 neon-border-pink animate-pulse" 
            : "bg-cyan-600 hover:bg-cyan-700 neon-border-blue"
        )}
      >
        {isDrawing ? "STOP" : "START"}
      </Button>

      {/* 中奖名单展示 */}
      {selectedPrize && (
        <div className="w-full max-w-4xl mt-8">
          <h3 className="text-2xl font-display text-center mb-4 neon-text-pink">
            {selectedPrize.name} 中奖名单
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 使用 winners 数组渲染 */}
            {useLottery().winners
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

    </div>
  );
}
