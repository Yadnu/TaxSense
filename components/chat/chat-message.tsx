"use client";

import { Bot } from "lucide-react";
import { InlineCitation } from "./source-citation";
import type { SourceReference } from "./source-citation";
import type { ReactNode } from "react";

// ─── Lightweight Markdown renderer ──────────────────────────────────────────

function renderInline(text: string, key?: number): ReactNode {
  const parts: ReactNode[] = [];
  const regex =
    /(\[Source:\s*[^\]]+\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let i = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const m = match[0];
    if (m.startsWith("[Source:")) {
      const title = m.match(/\[Source:\s*([^\]]+)\]/)?.[1]?.trim() ?? "";
      parts.push(<InlineCitation key={`s-${i++}`} title={title} />);
    } else if (m.startsWith("**")) {
      parts.push(<strong key={i++} className="font-semibold text-foreground">{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={i++} className="text-foreground/80">{m.slice(1, -1)}</em>);
    } else if (m.startsWith("`")) {
      parts.push(
        <code key={i++} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-blue-600 dark:text-blue-300">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("[")) {
      const linkText = m.match(/\[([^\]]+)\]/)?.[1] ?? "";
      const linkUrl = m.match(/\(([^)]+)\)/)?.[1] ?? "#";
      parts.push(
        <a key={i++} href={linkUrl} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-500 dark:hover:text-blue-300">
          {linkText}
        </a>
      );
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
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
        <ul key={nextKey()} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
              <span className="leading-relaxed text-foreground/80">{renderInline(item, j)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={nextKey()} className="my-2 list-decimal space-y-1.5 pl-5">
          {listItems.map((item, j) => (
            <li key={j} className="pl-1 leading-relaxed text-foreground/80">{renderInline(item, j)}</li>
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

    if (line.startsWith("```")) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(
        <pre key={nextKey()} className="my-2.5 overflow-x-auto rounded-lg bg-muted/60 p-3 text-xs text-foreground/80 ring-1 ring-border font-mono">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }

    if (line.trim() === "---") {
      flushList();
      elements.push(<hr key={nextKey()} className="my-3 border-border" />);
      i++; continue;
    }

    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    const heading = h3 ?? h2;
    if (heading) {
      flushList();
      elements.push(
        <p key={nextKey()} className={`${h3 ? "mt-3 text-sm font-semibold" : "mt-4 text-sm font-bold"} mb-1.5 text-foreground`}>
          {renderInline(heading[1])}
        </p>
      );
      i++; continue;
    }

    const ulMatch = line.match(/^[\-*•] (.+)/);
    if (ulMatch) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listItems.push(ulMatch[1]);
      i++; continue;
    }

    const olMatch = line.match(/^\d+\. (.+)/);
    if (olMatch) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listItems.push(olMatch[1]);
      i++; continue;
    }

    flushList();
    if (line.trim() !== "") {
      elements.push(
        <p key={nextKey()} className="my-1 leading-relaxed text-foreground/80">{renderInline(line)}</p>
      );
    }
    i++;
  }

  flushList();
  return elements;
}

// ─── ChatMessage ─────────────────────────────────────────────────────────────

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, sources, isStreaming = false }: ChatMessageProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end ts-animate-in">
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white shadow-md shadow-blue-900/20">
          <p className="leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 ts-animate-in">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
        <Bot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3">
          <div className="text-sm">{renderMarkdown(content)}</div>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400" />
          )}
        </div>

        {sources && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/40">Sources</span>
            {sources.map((s) => (
              <InlineCitation key={s.chunkId} title={s.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 ts-animate-in">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
        <Bot className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
      </div>
      <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-4">
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
