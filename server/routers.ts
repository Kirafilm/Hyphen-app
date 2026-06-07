import { authRouter } from "./_core/authRouter";
import { jobsRouter } from "./_core/jobsRouter";
import { notificationsRouter } from "./_core/notificationsRouter";
import { subscriptionRouter } from "./_core/subscriptionRouter";
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  jobs: jobsRouter,
  subscription: subscriptionRouter,
  notifications: notificationsRouter,
  auth: authRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
