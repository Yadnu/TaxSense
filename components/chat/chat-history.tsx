"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, SquarePen } from "lucide-react";

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

interface ChatHistoryProps {
  activeSessionId: string | null;
  onSelectSession: (session: ChatSessionSummary) => void;
  onNewChat: () => void;
  refreshKey?: number;
}

function groupByDate(sessions: ChatSessionSummary[]) {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: { label: string; items: ChatSessionSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Last 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (d >= today) groups[0].items.push(s);
    else if (d >= yesterday) groups[1].items.push(s);
    else if (d >= sevenDaysAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function ChatHistory({
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshKey = 0,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) setSessions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const groups = groupByDate(sessions);

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <div className="px-3 py-2.5">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <SquarePen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          New conversation
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.stone.700)_transparent]">
        {loading ? (
          <div className="space-y-1 px-1 pt-2">
            {[72, 55, 80].map((w, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
                <div className={`h-2.5 animate-pulse rounded bg-muted`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <MessageSquare className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">No conversations yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">Start chatting to see history</p>
            </div>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                {group.label}
              </p>
              {group.items.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className={`h-3 w-3 shrink-0 ${isActive ? "opacity-60" : "opacity-30 group-hover:opacity-50"}`} />
                    <span className="truncate text-[13px]">
                      {session.title ?? "Untitled conversation"}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
