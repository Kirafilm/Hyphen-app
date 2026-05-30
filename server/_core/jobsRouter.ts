import { isWorkDateWindow } from "@/lib/job-schedule";

function isSubscriptionActive(status: db.SubscriptionStatus) {
  if (status.plan === "none") return false;
  if (!status.expiresAt) return false;
  return status.expiresAt.getTime() > Date.now();
}

function canViewJobContact(job: db.JobRecord, viewer: { id: number; role: string } | null, activeSub: boolean) {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;
  if (job.createdByUserId === viewer.id) return true;
  return activeSub;
}

function toJobPublic(job: db.JobRecord, viewerCanSeeContact: boolean) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    workDateTbd: job.workDateTbd,
    workTimeTbd: job.workTimeTbd,
    workDate: job.workDate,
    workStartTime: job.workStartTime,
    workEndTime: job.workEndTime,
    budget: {
      min: job.budgetMin,
      max: job.budgetMax,
      currency: job.currency,
    },
    location: job.location,
    timeline: job.timeline,
    skills: job.skills,
    clientName: job.clientName,
    createdAt: job.createdAt,
    removedAt: job.removedAt,
    contact: viewerCanSeeContact
      ? { person: job.contactPerson, email: job.contactEmail, phone: job.contactPhone }
      : { person: null, email: null, phone: null },
    contactLocked: !viewerCanSeeContact,
    createdByUserId: job.createdByUserId,
  };
}

export const jobsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const viewer = ctx.user;
    const jobs = await db.listJobs(viewer);
    const emptySub: db.SubscriptionStatus = { plan: "none", expiresAt: null };
    const sub = viewer ? await db.getSubscriptionStatus(viewer.id) : emptySub;
    const activeSub = viewer ? isSubscriptionActive(sub) : false;
    return jobs.map((job) => toJobPublic(job, canViewJobContact(job, viewer, activeSub)));
  }),

  byId: publicProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const job = await db.getJobById(input.id);
    if (!job) return null;
    const viewer = ctx.user;
    if (job.removedAt && viewer?.role !== "admin") return null;
    const emptySub: db.SubscriptionStatus = { plan: "none", expiresAt: null };
    const sub = viewer ? await db.getSubscriptionStatus(viewer.id) : emptySub;
    const activeSub = viewer ? isSubscriptionActive(sub) : false;
    return toJobPublic(job, canViewJobContact(job, viewer, activeSub));
  }),

  listForModeration: adminProcedure.query(async ({ ctx }) => {
    const jobs = await db.listAllJobsForModeration();
    const emptySub: db.SubscriptionStatus = { plan: "none", expiresAt: null };
    const sub = await db.getSubscriptionStatus(ctx.user.id);
    const activeSub = isSubscriptionActive(sub);
    return jobs.map((job) => toJobPublic(job, canViewJobContact(job, ctx.user, activeSub)));
  }),

  create: protectedProcedure
    .input(
      z
        .object({
          title: z.string().min(1),
          description: z.string().min(1),
          category: z.string().min(1),
          // Keep supporting the legacy combined TBD flag so stale clients
          // don't fail validation when both date and time are marked unknown.
          workDateTimeTbd: z.boolean().optional(),
          workDateTbd: z.boolean().optional(),
          workTimeTbd: z.boolean().optional(),
          workDate: z
            .string()
            .optional()
            .transform((v) => (v ?? "").trim())
            .transform((v) => (v === "" ? null : v))
            .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid workDate"),
          workStartTime: z
            .string()
            .optional()
            .transform((v) => (v ?? "").trim())
            .transform((v) => (v === "" ? null : v))
            .refine((v) => v === null || /^\d{2}:\d{2}$/.test(v), "Invalid workStartTime"),
          workEndTime: z
            .string()
            .optional()
            .transform((v) => (v ?? "").trim())
            .transform((v) => (v === "" ? null : v))
            .refine((v) => v === null || /^\d{2}:\d{2}$/.test(v), "Invalid workEndTime"),
          budgetMin: z.number().int().min(0),
          budgetMax: z.number().int().min(0),
          currency: z.string().min(1),
          location: z.string().min(1),
          timeline: z.string().min(1).optional().default("未指定"),
          skills: z.array(z.string().min(1)).default([]),
          clientName: z.string().min(1),
          contactPerson: z
            .string()
            .optional()
            .transform((v) => (v ?? "").trim())
            .transform((v) => (v === "" ? null : v)),
          contactEmail: z.string().email(),
          contactPhone: z
            .string()
            .optional()
            .transform((value) => (value ?? "").trim())
            .refine((value) => value === "" || value.length >= 3, "Invalid phone")
            .transform((value) => (value === "" ? null : value)),
        })
        .superRefine((val, ctx) => {
          if (isWorkDateWindow(val.timeline)) {
            return;
          }

          const workDateTbd = val.workDateTbd ?? val.workDateTimeTbd ?? false;
          const workTimeTbd = val.workTimeTbd ?? val.workDateTimeTbd ?? false;

          if (!workDateTbd && !val.workDate) {
            ctx.addIssue({ code: "custom", path: ["workDate"], message: "workDate is required" });
          }
          if (!workTimeTbd && !val.workStartTime) {
            ctx.addIssue({ code: "custom", path: ["workStartTime"], message: "workStartTime is required" });
          }
          if (!workTimeTbd && !val.workEndTime) {
            ctx.addIssue({ code: "custom", path: ["workEndTime"], message: "workEndTime is required" });
          }
          if (!workTimeTbd && val.workStartTime && val.workEndTime && val.workEndTime <= val.workStartTime) {
            ctx.addIssue({
              code: "custom",
              path: ["workEndTime"],
              message: "workEndTime must be later than workStartTime",
            });
          }
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const usesWindow = isWorkDateWindow(input.timeline);
      const workDateTbd = usesWindow ? true : (input.workDateTbd ?? input.workDateTimeTbd ?? false);
      const workTimeTbd = usesWindow ? true : (input.workTimeTbd ?? input.workDateTimeTbd ?? false);

      const job = await db.createJob({
        title: input.title,
        description: input.description,
        category: input.category,
        workDateTbd,
        workTimeTbd,
        workDate: usesWindow ? null : input.workDate,
        workStartTime: usesWindow ? null : input.workStartTime,
        workEndTime: usesWindow ? null : input.workEndTime,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        currency: input.currency,
        location: input.location,
        timeline: input.timeline,
        skills: input.skills,
        clientName: input.clientName,
        contactPerson: input.contactPerson,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        createdByUserId: ctx.user.id,
      });

      void notifyNewJobPosted({
        id: job.id,
        title: job.title,
        category: job.category,
        createdByUserId: job.createdByUserId,
      }).catch((error) => {
        console.error("[Push] Failed to notify new job:", error);
      });

      return toJobPublic(job, true);
    }),

  remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const success = await db.removeJob(input.id);
    return { success } as const;
  }),

  delete: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const success = await db.deleteJob(input.id);
    return { success } as const;
  }),
});
