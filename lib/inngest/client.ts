import { Inngest } from "inngest";

/**
 * Shared Inngest client — import this everywhere you send events or define
 * functions.  The `id` must match across client, functions, and the serve()
 * handler so Inngest can reconcile them on the dashboard.
 */
export const inngest = new Inngest({ id: "taxsense" });

// ─── Event type map ───────────────────────────────────────────────────────────
// Declaring event types here gives full TypeScript inference when calling
// inngest.send() and in function handlers.

export type GuardrailBlockedEvent = {
  name: "guardrail/request.blocked";
  data: {
    userId: string;
    sessionId: string | null;
    stage: string;
    flags: string[];
    reason: string;
    guardRailEventId: string;
  };
};

export type InngestEvents = {
  "guardrail/request.blocked": GuardrailBlockedEvent;
};
