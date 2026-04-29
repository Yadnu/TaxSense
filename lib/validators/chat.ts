/**
 * Zod validation schemas for chat-related API input.
 *
 * These schemas are used by the /api/chat and /api/chat/sessions routes to
 * validate request bodies before any processing occurs.
 */

import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum character length for a single user message. */
export const MAX_MESSAGE_LENGTH = 4_000;

/** Maximum number of messages to accept in a single request (prevents abuse). */
export const MAX_MESSAGES_PER_REQUEST = 50;

/** Minimum length for a non-empty user message. */
export const MIN_MESSAGE_LENGTH = 1;

// ─── Schemas ──────────────────────────────────────────────────────────────────

/**
 * A single chat message from the Vercel AI SDK `useChat` hook.
 * Content can be a plain string (text) or an array of multimodal parts.
 */
export const ChatMessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system", "data"]),
    content: z.union([
      z
        .string()
        .min(MIN_MESSAGE_LENGTH)
        .max(MAX_MESSAGE_LENGTH, {
          message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters.`,
        }),
      z.array(z.unknown()),
    ]),
  })
  .passthrough();

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Full chat request body as sent by the Vercel AI SDK `useChat` hook.
 * The optional `sessionId` ties the conversation to an existing ChatSession row.
 * The `id` field is sent by the SDK but we use our own session IDs.
 */
export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, { message: "At least one message is required." })
    .max(MAX_MESSAGES_PER_REQUEST, {
      message: `Cannot send more than ${MAX_MESSAGES_PER_REQUEST} messages at once.`,
    }),
  sessionId: z.string().cuid("Invalid session ID format.").optional(),
  id: z.string().optional(), // AI SDK internal ID — not stored
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Schema for creating a new named chat session directly (e.g. via the history
 * panel's "rename" action — reserved for future use).
 */
export const CreateSessionSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(100, { message: "Session title must be at most 100 characters." })
    .optional(),
});

export type CreateSession = z.infer<typeof CreateSessionSchema>;
