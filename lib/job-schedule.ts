export const workDateWindows = ["7日內", "1個月內", "3個月內", "6個月內"] as const;

export type WorkDateWindow = (typeof workDateWindows)[number];

export function isWorkDateWindow(value: string | null | undefined): value is WorkDateWindow {
  return Boolean(value && workDateWindows.includes(value as WorkDateWindow));
}

type JobScheduleFields = {
  workDateTbd?: boolean;
  workTimeTbd?: boolean;
  workDate?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  timeline?: string | null;
};

export function formatJobSchedule(job: JobScheduleFields): string {
  if (isWorkDateWindow(job.timeline)) {
    return `工作日期：${job.timeline}`;
  }

  const dateTbd = Boolean(job.workDateTbd);
  const timeTbd = Boolean(job.workTimeTbd);
  const d = job.workDate;
  const s = job.workStartTime;
  const e = job.workEndTime;

  if (dateTbd && timeTbd) return "日期未定／時間未定";
  if (dateTbd && s && e) return `日期未定 ${s}-${e}`;
  if (timeTbd && d) return `${d} 時間未定`;
  if (dateTbd) return "日期未定";
  if (timeTbd) return "時間未定";
  if (d && s && e) return `${d} ${s}-${e}`;
  if (job.timeline && job.timeline !== "未指定") return job.timeline;
  return "未指定";
}
