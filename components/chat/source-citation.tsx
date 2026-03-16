"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export interface SourceReference {
  chunkId: string;
  title: string;
  source: string;
  excerpt?: string;
}

interface SourceCitationProps {
  source: SourceReference;
}

export function SourceCitation({ source }: SourceCitationProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="inline-block align-middle">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
        aria-expanded={expanded}
      >
        <BookOpen className="h-2.5 w-2.5" />
        {source.title}
        {source.excerpt &&
          (expanded ? (
            <ChevronUp className="h-2.5 w-2.5" />
          ) : (
            <ChevronDown className="h-2.5 w-2.5" />
          ))}
      </button>

      {expanded && source.excerpt && (
        <span className="mt-1 block rounded-lg border border-blue-100 bg-blue-50/60 p-2.5 text-xs leading-relaxed text-gray-600">
          <span className="mb-1 block font-medium text-blue-700">{source.title}</span>
          <span className="italic">{source.excerpt}&hellip;</span>
        </span>
      )}
    </span>
  );
}

/** Compact inline citation used inside rendered markdown */
export function InlineCitation({ title }: { title: string }) {
  return (
    <span className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 align-middle text-[10px] font-medium text-blue-700">
      <BookOpen className="h-2.5 w-2.5 shrink-0" />
      {title}
    </span>
  );
}
