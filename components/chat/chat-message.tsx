"use client";

import { Bot, User } from "lucide-react";
import { InlineCitation } from "./source-citation";
import type { SourceReference } from "./source-citation";
import type { ReactNode } from "react";

// ─── Lightweight Markdown renderer ──────────────────────────────────────────
// Handles the subset of markdown used by the tax chatbot:
//   - ## / ### headings
//   - **bold**, *italic*, `inline code`
//   - [text](url) links and [Source: name] citations
//   - Unordered  (- / * / •) and ordered (1.) lists
//   - ``` fenced code blocks
//   - --- horizontal rules

function renderInline(text: string, key?: number): ReactNode {
  const parts: ReactNode[] = [];
  // Order matters: Source citations before links, ** before *
  const regex =
    /(\[Source:\s*[^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let i = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const m = match[0];

    if (m.startsWith("[Source:")) {
      const title = m.match(/\[Source:\s*([^\]]+)\]/)?.[1]?.trim() ?? "";
      parts.push(<InlineCitation key={`s-${i++}`} title={title} />);
    } else if (m.startsWith("**")) {
      parts.push(
        <strong key={i++} className="font-semibold text-gray-900">
          {m.slice(2, -2)}
        </strong>
      );
    } else if (m.startsWith("*")) {
      parts.push(<em key={i++}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith("`")) {
      parts.push(
        <code
          key={i++}
          className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px] text-slate-800"
        >
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[")) {
      const linkText = m.match(/\[([^\]]+)\]/)?.[1] ?? "";
      const linkUrl = m.match(/\(([^)]+)\)/)?.[1] ?? "#";
      parts.push(
        <a
          key={i++}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
          {linkText}
        </a>
      );
    }

    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span key={key}>{parts}</span>;
}

function renderMarkdown(content: string): ReactNode[] {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let keyCount = 0;

  const nextKey = () => keyCount++;

  const flushList = () => {
    if (listItems.length === 0) return;
    if (listType === "ul") {
      elements.push(
        <ul key={nextKey()} className="my-1.5 space-y-1 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span className="leading-relaxed">{renderInline(item, j)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={nextKey()} className="my-1.5 list-decimal space-y-1 pl-5">
          {listItems.map((item, j) => (
            <li key={j} className="pl-1 leading-relaxed">
              {renderInline(item, j)}
            </li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={nextKey()}
          className="my-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-100"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      flushList();
      elements.push(<hr key={nextKey()} className="my-2 border-slate-200" />);
      i++;
      continue;
    }

    // Headings
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const heading = h3 ?? h2;
    if (heading) {
      flushList();
      elements.push(
        <p
          key={nextKey()}
          className={`${h3 ? "mt-2 text-sm font-semibold" : "mt-3 text-sm font-bold"} mb-1 text-gray-900`}
        >
          {renderInline(heading[1])}
        </p>
      );
      i++;
      continue;
    }

    // Unordered list item
    const ulMatch = line.match(/^[\-*•] (.+)/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      i++;
      continue;
    }

    // Ordered list item
    const olMatch = line.match(/^\d+\. (.+)/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      i++;
      continue;
    }

    // Blank line or regular paragraph
    flushList();
    if (line.trim() !== "") {
      elements.push(
        <p key={nextKey()} className="my-1 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }

  flushList();
  return elements;
}

// ─── ChatMessage component ────────────────────────────────────────────────────

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export function ChatMessage({
  role,
  content,
  sources,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex items-end gap-3 ts-animate-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-blue-900 text-white"
            : "border border-slate-200 bg-white text-blue-900"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        {isUser ? (
          <p className="leading-relaxed">{content}</p>
        ) : (
          <div className="text-sm">{renderMarkdown(content)}</div>
        )}

        {/* Typing cursor while streaming */}
        {isStreaming && !isUser && (
          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-gray-400" />
        )}

        {/* Source citations below assistant messages */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
            <span className="self-center text-[10px] font-medium uppercase tracking-wide text-gray-400">
              Sources
            </span>
            {sources.map((s) => (
              <InlineCitation key={s.chunkId} title={s.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Animated typing indicator (three bouncing dots) */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-900">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="chat-bubble-ai flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
