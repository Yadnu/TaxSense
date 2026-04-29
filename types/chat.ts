/**
 * Shared TypeScript types for chat sessions, messages, and RAG sources.
 *
 * These types mirror the Prisma-generated models but use ISO date strings
 * for JSON serialisation across API boundaries, and extend them with
 * runtime-specific shapes (e.g. parsed source citations).
 */

import type { MessageRole } from "@prisma/client";

// ─── Locale (extend with "hi" when adding Hindi) ─────────────────────────────

/** UI + API chat language. Add `"hi"` here and in Zod/UI when supporting Hindi. */
export type ChatLocale = "en" | "es";

export const CHAT_LOCALES: readonly ChatLocale[] = ["en", "es"] as const;

export function isChatLocale(value: string): value is ChatLocale {
  return value === "en" || value === "es";
}

// ─── Source citations ─────────────────────────────────────────────────────────

/**
 * A reference to a knowledge chunk that grounded an assistant response.
 * Stored as a JSON array on ChatMessage.sources.
 */
export interface SourceReference {
  /** UUID of the KnowledgeChunk row. */
  chunkId: string;
  /** Human-readable title of the source document. */
  title: string;
  /** Source file stem (e.g. "irs-pub-17-income"). */
  source: string;
  /** Short excerpt from the chunk for tooltip display. */
  excerpt: string;
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * A single chat message as returned by the API.
 */
export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  /** Parsed source citations from the JSON column (assistant messages only). */
  sources: SourceReference[];
  createdAt: string; // ISO 8601
}

/**
 * The shape the Vercel AI SDK `useChat` hook uses for its local message state.
 * Kept here so UI components can reference it without importing from `ai`.
 */
export interface UIChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  sources?: SourceReference[];
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/**
 * Chat session summary returned by GET /api/chat/sessions.
 */
export interface ChatSessionSummary {
  id: string;
  title: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  _count: {
    messages: number;
  };
}

/**
 * Chat session detail returned by GET /api/chat/sessions/[id]/messages.
 * Includes the full message history.
 */
export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessageRecord[];
}

// ─── API request / response shapes ───────────────────────────────────────────

/**
 * Request body for POST /api/chat.
 * Compatible with the Vercel AI SDK `useChat` hook's default payload.
 */
export interface ChatRequestBody {
  messages: UIChatMessage[];
  /** Existing session ID to append to; omit to start a new session. */
  sessionId?: string;
  /** AI SDK per-chat UUID (unused server-side but required by the SDK). */
  id?: string;
  /** Response language for assistant replies and disclaimers. */
  locale?: ChatLocale;
}

/**
 * Response headers returned alongside the streaming body from POST /api/chat.
 */
export interface ChatStreamHeaders {
  /** The session ID (new or existing) for this conversation turn. */
  "X-Session-Id": string;
}
