"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex-shrink-0 border-t border-slate-200 bg-white p-4"
    >
      <div className="mx-auto flex max-w-2xl items-end gap-3">
        <textarea
          ref={textareaRef}
          name="prompt"
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a tax question… (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
          className="field-input flex-1 resize-none py-2.5 leading-relaxed disabled:opacity-60"
          style={{ maxHeight: "140px" }}
          aria-label="Tax question input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary aspect-square shrink-0 p-2.5"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] text-gray-400">
        TaxSense AI may make mistakes. Always verify with official IRS and
        California FTB publications.
      </p>
    </form>
  );
}
