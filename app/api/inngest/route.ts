import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  guardrailThresholdAlert,
  guardrailDailyDigest,
} from "@/lib/inngest/functions/guardrail-alert";

/**
 * Inngest serving handler.
 * Registers all background functions with the Inngest platform.
 * Accessible at /api/inngest — add this URL in the Inngest dashboard under
 * Apps → Add app when deploying.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [guardrailThresholdAlert, guardrailDailyDigest],
});
