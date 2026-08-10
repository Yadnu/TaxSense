/**
 * Per-user daily message quota — enforces a rolling 24-hour limit on the
 * number of chat messages a single user can send.
 *
 * The count is derived from USER-role ChatMessage rows joined through the
 * user's ChatSessions, so only successfully persisted messages count toward
 * the limit.  Blocked requests (jailbreak, off-topic, etc.) are never
 * persisted and therefore never deducted from the quota.
 */

import prisma from "@/lib/db";

/** Maximum USER-role messages allowed per rolling 24-hour window. */
export const DAILY_MESSAGE_LIMIT = 50;

const REFUSAL_QUOTA_EXCEEDED =
  `You've reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. ` +
  "Your quota resets 24 hours after your first message today. " +
  "In the meantime, IRS.gov and FTB.ca.gov have searchable help centers for urgent questions.";

export interface QuotaResult {
  allowed: boolean;
  /** Pre-built refusal text; defined only when `allowed` is false. */
  refusalResponse?: string;
  /** Actual count used for the decision (useful for logging). */
  dailyCount: number;
}

/**
 * Returns whether `userId` is within their daily message quota.
 *
 * The window is a rolling 24 hours rather than a calendar day so users cannot
 * "reset" the counter by sending bursts just after midnight.
 */
export async function checkDailyQuota(userId: string): Promise<QuotaResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const dailyCount = await prisma.chatMessage.count({
    where: {
      session: { userId },
      role: "USER",
      createdAt: { gt: since },
    },
  });

  if (dailyCount >= DAILY_MESSAGE_LIMIT) {
    return {
      allowed: false,
      refusalResponse: REFUSAL_QUOTA_EXCEEDED,
      dailyCount,
    };
  }

  return { allowed: true, dailyCount };
}
