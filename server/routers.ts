import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 奖品相关路由
  prize: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPrizesByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        totalCount: z.number().int().positive(),
        imageBase64: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let imageUrl: string | undefined;
        let imageKey: string | undefined;
        
        // 如果有图片，上传到 S3
        if (input.imageBase64) {
          const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `lottery/${ctx.user.id}/prizes/${nanoid()}.png`;
          const result = await storagePut(key, buffer, 'image/png');
          imageUrl = result.url;
          imageKey = key;
        }
        
        return await db.createPrize({
          name: input.name,
          totalCount: input.totalCount,
          remainingCount: input.totalCount,
          imageUrl,
          imageKey,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        totalCount: z.number().int().positive().optional(),
        imageBase64: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        
        if (input.name) updateData.name = input.name;
        if (input.totalCount) {
          updateData.totalCount = input.totalCount;
          // 如果总数量变化，同步更新剩余数量（保持比例）
          const currentPrize = (await db.getPrizesByUserId(ctx.user.id)).find(p => p.id === input.id);
          if (currentPrize) {
            const ratio = currentPrize.remainingCount / currentPrize.totalCount;
            updateData.remainingCount = Math.floor(input.totalCount * ratio);
          }
        }
        
        // 如果有新图片，上传到 S3
        if (input.imageBase64) {
          const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `lottery/${ctx.user.id}/prizes/${nanoid()}.png`;
          const result = await storagePut(key, buffer, 'image/png');
          updateData.imageUrl = result.url;
          updateData.imageKey = key;
        }
        
        await db.updatePrize(input.id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePrize(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // 参与者相关路由
  participant: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getParticipantsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return await db.createParticipant({
          name: input.name,
          userId: ctx.user.id,
        });
      }),
    
    createBatch: protectedProcedure
      .input(z.object({ names: z.array(z.string().min(1)) }))
      .mutation(async ({ ctx, input }) => {
        const participants = input.names.map(name => ({
          name,
          userId: ctx.user.id,
        }));
        await db.createParticipantsBatch(participants);
        return { success: true, count: participants.length };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteParticipant(input.id, ctx.user.id);
        return { success: true };
      }),
    
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllParticipants(ctx.user.id);
      return { success: true };
    }),
  }),

  // 中奖记录相关路由
  winner: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getWinnersByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        participantName: z.string(),
        prizeId: z.number(),
        prizeName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 创建中奖记录
        const winner = await db.createWinner({
          participantId: input.participantId,
          participantName: input.participantName,
          prizeId: input.prizeId,
          prizeName: input.prizeName,
          userId: ctx.user.id,
        });
        
        // 减少奖品剩余数量
        const prizes = await db.getPrizesByUserId(ctx.user.id);
        const prize = prizes.find(p => p.id === input.prizeId);
        if (prize && prize.remainingCount > 0) {
          await db.updatePrize(input.prizeId, ctx.user.id, {
            remainingCount: prize.remainingCount - 1,
          });
        }
        
        return winner;
      }),
    
    deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllWinners(ctx.user.id);
      return { success: true };
    }),
  }),

  // 系统操作路由
  lottery: router({
    // 重置抽奖状态（仅清空中奖记录）
    resetLottery: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllWinners(ctx.user.id);
      await db.resetPrizeCounts(ctx.user.id);
      return { success: true };
    }),
    
    // 清空所有数据
    clearAll: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteAllWinners(ctx.user.id);
      await db.deleteAllParticipants(ctx.user.id);
      
      // 删除所有奖品
      const prizes = await db.getPrizesByUserId(ctx.user.id);
      for (const prize of prizes) {
        await db.deletePrize(prize.id, ctx.user.id);
      }
      
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
