# 年会抽奖系统 - 任务清单

## 已完成功能 ✅
- [x] 基础项目架构搭建
- [x] 赛博朋克视觉风格设计
- [x] 奖品和参与者管理界面
- [x] 炫酷抽奖动画效果
- [x] 中奖名单展示
- [x] 奖品配图支持
- [x] 本地图片上传功能（IndexedDB）
- [x] 全部抽取功能
- [x] 高级重置选项
- [x] **升级为全栈架构，添加数据库支持**
- [x] **设计数据库表结构（奖品、参与者、中奖记录）**
- [x] **实现后端 API 接口（tRPC）**
- [x] **迁移前端数据逻辑从 IndexedDB 到云端 API**
- [x] **图片上传到 S3 云存储**
- [x] **测试数据持久化功能（所有测试通过）**

## 待优化功能 🔄
- [ ] 添加键盘快捷键（空格键控制开始/停止）
- [ ] 导出中奖名单功能（Excel/CSV）
- [ ] 音效增强（背景音乐和抽奖音效）
- [ ] 优化移动端响应式布局
- [ ] 添加抽奖历史记录查看

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS 4
- **后端**: Express + tRPC 11
- **数据库**: PostgreSQL (via Drizzle ORM)
- **存储**: S3 (Manus 内置)
- **动画**: Framer Motion + Canvas Confetti
- **UI 组件**: shadcn/ui

## 数据库表结构

### prizes (奖品表)
- id, name, totalCount, remainingCount
- imageUrl, imageKey (S3 存储)
- userId (所有者)
- createdAt, updatedAt

### participants (参与者表)
- id, name
- userId (所有者)
- createdAt, updatedAt

### winners (中奖记录表)
- id, participantId, participantName
- prizeId, prizeName
- userId (所有者)
- createdAt (中奖时间)
