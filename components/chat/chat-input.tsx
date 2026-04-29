"use client";

import { useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import type { ChatLocale } from "@/types/chat";

const PLACEHOLDER: Record<ChatLocale, string> = {
  en: "Ask a tax question…",
  es: "Haga una pregunta fiscal…",
};

const FOOTER_HINT: Record<ChatLocale, string> = {
  en: "Enter to send · Shift+Enter for new line",
  es: "Enter para enviar · Mayús+Enter para nueva línea",
};

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  showDisclaimer?: boolean;
  /** Affects placeholder and footer copy. Default \`en\`. */
  locale?: ChatLocale;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  showDisclaimer = false,
  locale = "en",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const canSubmit = input.trim().length > 0 && !isLoading;

  return (
    <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
      <form onSubmit={onSubmit} className="mx-auto max-w-2xl">
        <div className={`flex items-end gap-2 rounded-xl border bg-background px-3 py-2 transition-all duration-150 ${
          canSubmit
            ? "border-border ring-1 ring-blue-500/20"
            : "border-border"
        }`}>
          <textarea
            ref={textareaRef}
            name="prompt"
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER[locale]}
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-40"
            style={{ maxHeight: "160px" }}
            aria-label="Tax question input"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
                : "bg-muted text-muted-foreground/40"
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground/40">
          {showDisclaimer ? (
            locale === "es" ? (
              <>
                Solo con fines informativos · Verifique en{" "}
                <a
                  href="https://www.irs.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground"
                >
                  IRS
                </a>{" "}
                y en{" "}
                <a
                  href="https://www.ftb.ca.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground"
                >
                  FTB de California
                </a>
              </>
            ) : (
              <>
                For informational purposes only · Verify with{" "}
                <a
                  href="https://www.irs.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground"
                >
                  IRS
                </a>{" "}
                and{" "}
                <a
                  href="https://www.ftb.ca.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground"
                >
                  California FTB
                </a>
              </>
            )
          ) : (
            <>{FOOTER_HINT[locale]}</>
          )}
        </p>
      </form>
    </div>
  );
}
