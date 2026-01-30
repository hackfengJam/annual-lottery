import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useLottery } from "@/hooks/useLottery";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function PrizeManager() {
  const { prizes, addPrize, deletePrize } = useLottery();
  const [isOpen, setIsOpen] = useState(false);
  const [newPrize, setNewPrize] = useState({ name: '', count: 1, image: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 限制图片大小为 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewPrize(prev => ({ ...prev, image: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrize.name) {
      toast.error('请输入奖品名称');
      return;
    }

    await addPrize(newPrize);
    setIsOpen(false);
    setNewPrize({ name: '', count: 1, image: '' });
    toast.success('奖品添加成功');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display text-primary neon-text-pink">奖品列表</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
              <Plus className="mr-2 h-4 w-4" /> 添加奖品
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-pink-500 text-white">
            <DialogHeader>
              <DialogTitle>添加新奖品</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>奖品名称</Label>
                <Input 
                  value={newPrize.name}
                  onChange={e => setNewPrize(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-black/50 border-pink-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label>数量</Label>
                <Input 
                  type="number"
                  min="1"
                  value={newPrize.count}
                  onChange={e => setNewPrize(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="bg-black/50 border-pink-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label>图片</Label>
                <div className="flex items-center gap-4">
                  {newPrize.image ? (
                    <div className="relative w-20 h-20 border border-pink-500/50 rounded overflow-hidden">
                      <img src={newPrize.image} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-6 w-6 rounded-none"
                        onClick={() => setNewPrize(prev => ({ ...prev, image: '' }))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-dashed border-pink-500/50 rounded flex items-center justify-center bg-black/30">
                      <ImageIcon className="h-8 w-8 text-pink-500/50" />
                    </div>
                  )}
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1 bg-black/50 border-pink-500/50"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                确认添加
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes.map(prize => (
          <Card key={prize.id} className="bg-black/40 border-pink-500/30 overflow-hidden group relative">
            <CardContent className="p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded bg-black/50 flex-shrink-0 overflow-hidden border border-pink-500/20">
                {prize.image ? (
                  <img src={prize.image} alt={prize.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="h-8 w-8 text-pink-500/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg truncate text-pink-100">{prize.name}</h4>
                <p className="text-sm text-pink-400/70">数量: {prize.count} (剩余: {prize.remaining})</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-950/30"
                onClick={() => {
                  if (confirm(`确定要删除奖品 "${prize.name}" 吗？`)) {
                    deletePrize(prize.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Gift } from "lucide-react";
