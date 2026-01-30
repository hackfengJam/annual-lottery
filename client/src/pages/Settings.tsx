import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLottery } from "@/hooks/useLottery";
import { toast } from "sonner";
import { Upload, Trash2, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { parseCSV } from "@/lib/utils";
import PrizeManager from "@/components/PrizeManager";

export default function Settings() {
  const { 
    participants, 
    importParticipants, 
    importPrizes, 
    resetLottery,
    clearAllData
  } = useLottery();

  const [participantInput, setParticipantInput] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetLottery = async () => {
    await resetLottery();
    setIsResetDialogOpen(false);
    toast.success('已重置抽奖状态，名单和奖品保留');
  };

  const handleClearAll = async () => {
    await clearAllData();
    setIsResetDialogOpen(false);
    toast.success('已清空所有数据');
  };
  const [prizeInput, setPrizeInput] = useState('');

  const handleParticipantUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = parseCSV(content);
        // 假设 CSV 包含 name 和 department 列
        const validData = data.filter(d => d.name).map(d => ({
          name: d.name,
          department: d.department
        }));
        
        if (validData.length > 0) {
          importParticipants(validData);
          toast.success(`成功导入 ${validData.length} 名参与者`);
        } else {
          toast.error('未找到有效数据，请检查 CSV 格式');
        }
      } catch (error) {
        toast.error('文件解析失败');
      }
    };
    reader.readAsText(file);
  };

  const handlePrizeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = parseCSV(content);
        // 假设 CSV 包含 name, count, image 列
        const validData = data.filter(d => d.name && d.count).map(d => ({
          name: d.name,
          count: parseInt(d.count) || 1,
          image: d.image
        }));
        
        if (validData.length > 0) {
          importPrizes(validData);
          toast.success(`成功导入 ${validData.length} 个奖项`);
        } else {
          toast.error('未找到有效数据，请检查 CSV 格式');
        }
      } catch (error) {
        toast.error('文件解析失败');
      }
    };
    reader.readAsText(file);
  };

  const handleManualParticipantImport = () => {
    const lines = participantInput.split('\n').filter(l => l.trim());
    const data = lines.map(line => {
      const [name, department] = line.split(/[,，\s]+/).map(s => s.trim());
      return { name, department };
    });

    if (data.length > 0) {
      importParticipants(data);
      setParticipantInput('');
      toast.success(`成功添加 ${data.length} 名参与者`);
    }
  };

  const handleManualPrizeImport = () => {
    const lines = prizeInput.split('\n').filter(l => l.trim());
    const data = lines.map(line => {
      // 支持格式: 名称 数量 [图片链接]
      // 使用正则匹配，因为图片链接可能包含特殊字符
      const parts = line.trim().split(/\s+/);
      const name = parts[0];
      const count = parseInt(parts[1]) || 1;
      const image = parts.length > 2 ? parts[2] : undefined;
      
      return { name, count, image };
    });

    if (data.length > 0) {
      importPrizes(data);
      setPrizeInput('');
      toast.success(`成功添加 ${data.length} 个奖项`);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-primary neon-text-pink">系统设置</h1>
        
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="neon-border-pink bg-red-950/50 hover:bg-red-900/50 border-red-500/50">
              <Trash2 className="mr-2 h-4 w-4" /> 数据重置选项
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 border-red-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-500 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> 危险操作警告
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                请选择您要执行的重置操作。此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="border border-yellow-500/30 bg-yellow-950/20 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-yellow-500">仅重置抽奖状态</h4>
                <p className="text-sm text-gray-300">
                  清空所有中奖记录，重置奖品剩余数量。
                  <br />
                  <span className="text-green-400">保留参与者名单和奖品设置。</span>
                </p>
                <Button onClick={handleResetLottery} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white mt-2">
                  重置抽奖状态 (重新开始)
                </Button>
              </div>

              <div className="border border-red-500/30 bg-red-950/20 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-red-500">清空所有数据</h4>
                <p className="text-sm text-gray-300">
                  彻底清空所有数据，包括中奖记录、参与者名单和奖品设置。
                  <br />
                  <span className="text-red-400">系统将变为空白状态。</span>
                </p>
                <Button onClick={handleClearAll} variant="destructive" className="w-full mt-2">
                  清空所有数据
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 参与者设置 */}
        <Card className="glass-panel neon-border-blue">
          <CardHeader>
            <CardTitle className="text-secondary neon-text-blue">参与者管理 ({participants.length}人)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>批量导入 (CSV)</Label>
              <div className="flex gap-2">
                <Input type="file" accept=".csv" onChange={handleParticipantUpload} className="bg-black/30" />
              </div>
              <p className="text-xs text-muted-foreground">格式: 姓名, 部门</p>
            </div>
            
            <div className="space-y-2">
              <Label>手动输入</Label>
              <Textarea 
                placeholder="每行一个: 姓名 部门" 
                value={participantInput}
                onChange={e => setParticipantInput(e.target.value)}
                className="bg-black/30 min-h-[150px]"
              />
              <Button onClick={handleManualParticipantImport} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <Save className="mr-2 h-4 w-4" /> 添加参与者
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 奖品设置 */}
        <Card className="bg-black/40 border-pink-500/30 neon-border-pink">
          <CardHeader>
            <CardTitle className="text-2xl font-display text-pink-400">奖品设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <PrizeManager />
            
            <div className="border-t border-pink-500/30 pt-6">
              <h4 className="text-lg font-semibold mb-4 text-pink-300">批量导入</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CSV 文件导入</Label>
                  <div className="flex gap-2">
                    <Input type="file" accept=".csv" onChange={handlePrizeUpload} className="bg-black/30" />
                  </div>
                  <p className="text-xs text-muted-foreground">格式: 奖品名称, 数量</p>
                </div>
                
                <div className="space-y-2">
                  <Label>文本批量导入</Label>
                  <Textarea 
                    placeholder="每行一个: 奖品名称 数量 [图片链接]" 
                    value={prizeInput}
                    onChange={e => setPrizeInput(e.target.value)}
                    className="bg-black/30 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">示例: iPhone 15 1 https://example.com/iphone.jpg</p>
                  <Button onClick={handleManualPrizeImport} variant="outline" className="w-full border-pink-500/50 hover:bg-pink-950/30">
                    <Save className="mr-2 h-4 w-4" /> 批量添加
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
