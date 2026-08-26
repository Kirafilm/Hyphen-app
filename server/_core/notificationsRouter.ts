import { z } from "zod";
import * as db from "../db";
import { publicProcedure, router } from "./trpc";

export const notificationsRouter = router({
  getSettings: publicProcedure
    .input(z.object({ expoPushToken: z.string().min(1) }))
    .query(async ({ input }) => {
      const device = await db.getPushDevice(input.expoPushToken);
      return {
        jobAlertsEnabled: device?.jobAlertsEnabled ?? true,
        messageAlertsEnabled: device?.messageAlertsEnabled ?? true,
        registered: Boolean(device),
      };
    }),

  register: publicProcedure
    .input(
      z.object({
        expoPushToken: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]).optional(),
        jobAlertsEnabled: z.boolean().optional(),
        messageAlertsEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertPushDevice({
        expoPushToken: input.expoPushToken,
        userId: ctx.user?.id ?? null,
        platform: input.platform ?? null,
        jobAlertsEnabled: input.jobAlertsEnabled,
        messageAlertsEnabled: input.messageAlertsEnabled,
      });
      return { success: true as const };
    }),

  setJobAlerts: publicProcedure
    .input(
      z.object({
        expoPushToken: z.string().min(1),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await db.setPushDeviceJobAlerts(input.expoPushToken, input.enabled);
      return { success: true as const };
    }),

  setMessageAlerts: publicProcedure
    .input(
      z.object({
        expoPushToken: z.string().min(1),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await db.setPushDeviceMessageAlerts(input.expoPushToken, input.enabled);
      return { success: true as const };
    }),
});
