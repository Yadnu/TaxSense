/**
 * Guardrail event persistence.
 *
 * Writes a `GuardrailEvent` record to the database for every guardrail
 * pipeline execution that raised at least one flag or blocked the request.
 * For blocked requests, also fires an Inngest event so the threshold-alert
 * and daily-digest functions can react asynchronously.
 */

import prisma from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

export interface RecordGuardrailEventParams {
  userId: string;
  sessionId?: string | null;
  /** "input" for the pre-LLM pipeline; "output" for post-generation PII scan. */
  stage: "input" | "output";
  flags: string[];
  blocked: boolean;
  reason?: string;
}

/**
 * Persists a guardrail event to the database.
 * When `blocked` is true, also dispatches an Inngest event for real-time
 * threshold alerting.
 *
 * This function never throws — failures are logged and swallowed so a DB or
 * Inngest outage never surfaces as a chat error to the end user.
 */
export async function recordGuardrailEvent(
  params: RecordGuardrailEventParams,
): Promise<void> {
  const { userId, sessionId, stage, flags, blocked, reason } = params;

  let eventId: string | undefined;

  try {
    const record = await prisma.guardrailEvent.create({
      data: {
        userId,
        sessionId: sessionId ?? null,
        stage,
        flags,
        blocked,
        reason: reason ?? null,
      },
    });
    eventId = record.id;
  } catch (err) {
    console.error("[guardrails/events] Failed to persist GuardrailEvent:", err);
    return;
  }

  // Fire an Inngest event for blocked requests so the threshold-alert
  // function can count recent jailbreak attempts in real time.
  if (blocked && eventId) {
    try {
      await inngest.send({
        name: "guardrail/request.blocked",
        data: {
          userId,
          sessionId: sessionId ?? null,
          stage,
          flags,
          reason: reason ?? "",
          guardRailEventId: eventId,
        },
      });
    } catch (err) {
      // Inngest dispatch failure is non-fatal; the DB record already exists.
      console.error("[guardrails/events] Failed to dispatch Inngest event:", err);
    }
  }
}
