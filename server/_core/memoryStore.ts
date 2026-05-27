import type { User } from "../../drizzle/schema";
import { randomUUID } from "crypto";

export type SubscriptionPlan = "none" | "monthly" | "yearly";

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  expiresAt: Date | null;
};

export type JobRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  location: string;
  timeline: string;
  skills: string[];
  clientName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdByUserId: number;
  createdAt: Date;
  removedAt: Date | null;
};

const subscriptions = new Map<number, SubscriptionStatus>();

const seedJobs: Omit<JobRecord, "id">[] = [
  {
    title: "[長期合作] Looking for a high-energy English-speaking MC in Hong Kong",
    description:
      "We are looking for a high-energy English-speaking MC / Event Host to support upcoming corporate events and produce a wrap-up video. Event Details • Hong Kong: 17 June @ Wan Chai Convention & Exhibition Centre ⸻ Scope of Work • Host / appear as MC during the event • Be featured in on-site filming (interactions, highlights, key moments) • Record voice-over (VO) after the event • Final deliverable: 40–60 min event wrap-up video",
    category: "活動及表演",
    budgetMin: 2000,
    budgetMax: 5000,
    currency: "HKD",
    location: "香港",
    timeline: "3日內",
    skills: ["商務司儀", "活動司儀"],
    clientName: "Mika Cheng",
    contactEmail: "mika@example.com",
    contactPhone: "+852 9123 4567",
    createdByUserId: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
    removedAt: null,
  },
  {
    title: "Short Marketing Video Required for Shop",
    description:
      "Looking for professional video production for marketing purposes. Need high-quality editing and effects.",
    category: "攝影及影音製作",
    budgetMin: 2000,
    budgetMax: 5000,
    currency: "HKD",
    location: "香港",
    timeline: "30日內",
    skills: ["影片製作", "視頻編輯"],
    clientName: "Andy K.",
    contactEmail: "andy@example.com",
    contactPhone: "+852 9345 6789",
    createdByUserId: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
    removedAt: null,
  },
];

const jobs: JobRecord[] = seedJobs.map((job) => ({ ...job, id: randomUUID() }));

function isSubscriptionActive(status: SubscriptionStatus | undefined) {
  if (!status) return false;
  if (status.plan === "none") return false;
  if (!status.expiresAt) return false;
  return status.expiresAt.getTime() > Date.now();
}

export function getSubscriptionStatus(userId: number): SubscriptionStatus {
  return subscriptions.get(userId) ?? { plan: "none", expiresAt: null };
}

export function setSubscriptionStatus(userId: number, status: SubscriptionStatus) {
  subscriptions.set(userId, status);
}

export function listJobs(viewer: User | null): JobRecord[] {
  const includeRemoved = Boolean(viewer?.role === "admin");
  return jobs
    .filter((job) => (includeRemoved ? true : !job.removedAt))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getJobById(id: string): JobRecord | null {
  return jobs.find((job) => job.id === id) ?? null;
}

export function createJob(input: Omit<JobRecord, "id" | "createdAt" | "removedAt">): JobRecord {
  const job: JobRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date(),
    removedAt: null,
  };
  jobs.unshift(job);
  return job;
}

export function removeJob(id: string) {
  const job = getJobById(id);
  if (!job) return null;
  job.removedAt = new Date();
  return job;
}

export function canViewJobContact(job: JobRecord, viewer: User | null): boolean {
  if (!viewer) return false;
  if (viewer.role === "admin") return true;
  if (job.createdByUserId === viewer.id) return true;
  return isSubscriptionActive(subscriptions.get(viewer.id));
}

