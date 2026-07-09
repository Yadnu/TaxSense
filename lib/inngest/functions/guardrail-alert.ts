/**
 * Inngest functions for guardrail observability.
 *
 * guardrailThresholdAlert
 *   Triggered every time a request is blocked by the guardrail pipeline.
 *   Counts jailbreak events in a rolling 1-hour window; if the count
 *   exceeds JAILBREAK_THRESHOLD it logs a structured warning that downstream
 *   alerting systems (PagerDuty, Datadog, etc.) can pick up from logs.
 *   Replace the console.warn in the "fire-alert" step with a Resend email
 *   or webhook call when you have an alerting channel configured.
 *
 * guardrailDailyDigest
 *   Runs at 09:00 UTC every day.  Queries the prior 24 hours of GuardrailEvent
 *   rows and logs a structured summary. Swap the console.log for a Resend
 *   email or Slack webhook to deliver the digest to your team.
 */

import prisma from "@/lib/db";
import { inngest } from "../client";

const JAILBREAK_THRESHOLD = 5; // attempts per rolling hour before alerting

// ─── Threshold alert ─────────────────────────────────────────────────────────

export const guardrailThresholdAlert = inngest.createFunction(
  { id: "guardrail-threshold-alert", name: "Guardrail: jailbreak threshold alert" },
  { event: "guardrail/request.blocked" },
  async ({ event, step }) => {
    // Only react to jailbreak-category blocks
    const flags = (event.data.flags ?? []) as string[];
    const isJailbreak = flags.some((f: string) => f.startsWith("jailbreak:"));
    if (!isJailbreak) return { skipped: true, reason: "not a jailbreak event" };

    const recentCount = await step.run("count-recent-jailbreaks", async () => {
      const since = new Date(Date.now() - 60 * 60 * 1000); // last hour
      return prisma.guardrailEvent.count({
        where: {
          blocked: true,
          // Postgres TEXT[] — match any row that has at least one jailbreak flag
          flags: { hasSome: ["jailbreak:ignore_instructions", "jailbreak:forget_instructions", "jailbreak:pretend_no_rules", "jailbreak:reveal_system_prompt", "jailbreak:reveal_model", "jailbreak:dan", "jailbreak:role_override", "jailbreak:prompt_injection_syntax", "jailbreak:act_without_restrictions"] },
          createdAt: { gte: since },
        },
      });
    });

    if (recentCount >= JAILBREAK_THRESHOLD) {
      await step.run("fire-alert", async () => {
        // Replace this with a Resend email / Slack webhook when ready.
        console.warn("[inngest][guardrail-alert] Jailbreak threshold exceeded", {
          count: recentCount,
          threshold: JAILBREAK_THRESHOLD,
          windowMinutes: 60,
          triggeringUserId: event.data.userId,
          triggeringEventId: event.data.guardRailEventId,
        });
      });
    }

    return { recentCount, alerted: recentCount >= JAILBREAK_THRESHOLD };
  },
);

// ─── Daily digest ─────────────────────────────────────────────────────────────

export const guardrailDailyDigest = inngest.createFunction(
  { id: "guardrail-daily-digest", name: "Guardrail: daily digest" },
  { cron: "0 9 * * *" }, // 09:00 UTC every day
  async ({ step }) => {
    const stats = await step.run("query-24h-stats", async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [total, blocked, byFlag] = await Promise.all([
        prisma.guardrailEvent.count({ where: { createdAt: { gte: since } } }),
        prisma.guardrailEvent.count({ where: { blocked: true, createdAt: { gte: since } } }),
        // Fetch all flags from the last 24 h and tally client-side
        prisma.guardrailEvent.findMany({
          where: { createdAt: { gte: since } },
          select: { flags: true },
        }),
      ]);

      const flagCounts: Record<string, number> = {};
      for (const { flags } of byFlag) {
        for (const f of flags as string[]) {
          flagCounts[f] = (flagCounts[f] ?? 0) + 1;
        }
      }

      return { total, blocked, allowed: total - blocked, flagCounts };
    });

    // Replace with Resend / Slack when you have an alerting channel.
    await step.run("log-digest", async () => {
      console.log("[inngest][guardrail-digest] 24-hour summary", stats);
    });

    return stats;
  },
);
