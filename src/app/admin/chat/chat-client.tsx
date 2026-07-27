"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playChime } from "@/lib/chime";

type Conversation = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  important: boolean;
  aiEnabled: boolean;
  unreadAdmin: number;
  lastMessageAt: string;
  createdAt: string;
};

type Filter = "all" | "unread" | "read" | "important";
type Msg = { id: string; sender: "visitor" | "admin" | "assistant"; body: string; createdAt: string };

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function label(c: Conversation) {
  return c.name?.trim() || c.email?.trim() || `Visitor ${c.id.slice(0, 6)}`;
}

export default function ChatClient({ adminName }: { adminName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const prevUnread = useRef<number | null>(null);
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/chat");
      const data = await res.json();
      const convs: Conversation[] = data.conversations || [];
      const totalUnread = convs.reduce((sum, c) => sum + (c.id === activeRef.current ? 0 : c.unreadAdmin || 0), 0);
      if (prevUnread.current !== null && totalUnread > prevUnread.current) playChime();
      prevUnread.current = totalUnread;
      setConversations(convs);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/chat/${id}`);
      const data = await res.json();
      const next: Msg[] = data.messages || [];
      // Keep the same array reference when nothing changed so the
      // autoscroll effect doesn't re-fire on every poll.
      setMessages((prev) =>
        prev.length === next.length && prev[prev.length - 1]?.id === next[next.length - 1]?.id ? prev : next,
      );
    } catch {
      /* ignore */
    }
  }, []);

  // initial + polling
  useEffect(() => {
    loadConversations();
    const id = setInterval(() => {
      loadConversations();
      if (activeRef.current) loadMessages(activeRef.current);
    }, 4000);
    return () => clearInterval(id);
  }, [loadConversations, loadMessages]);

  const openConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      loadMessages(id);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadAdmin: 0 } : c)));
    },
    [loadMessages],
  );

  // Jump to the bottom when opening a conversation…
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
  }, [activeId]);

  // …but on new messages only follow if the admin is already near the
  // bottom — never yank them down while they're reading history.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight }));
  }, [messages]);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = reply.trim();
      if (!text || !activeId || sending) return;
      setSending(true);
      const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "admin", body: text, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, optimistic]);
      setReply("");
      try {
        const res = await fetch(`/api/admin/chat/${activeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const data = await res.json();
        if (data.message) setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
        // The server disables IKORA on human reply — mirror that locally.
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, aiEnabled: false } : c)));
        loadConversations();
      } catch {
        /* keep optimistic */
      } finally {
        setSending(false);
      }
    },
    [reply, activeId, sending, loadConversations],
  );

  const toggleImportant = useCallback(async (id: string, value: boolean) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, important: value } : c)));
    try {
      await fetch(`/api/admin/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ important: value }),
      });
    } catch {
      /* optimistic */
    }
  }, []);

  const toggleAi = useCallback(async (id: string, value: boolean) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, aiEnabled: value } : c)));
    try {
      await fetch(`/api/admin/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai: value }),
      });
    } catch {
      /* optimistic */
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (!window.confirm("Delete this conversation permanently? This cannot be undone.")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeRef.current === id) {
      setActiveId(null);
      setMessages([]);
    }
    try {
      await fetch(`/api/admin/chat/${id}`, { method: "DELETE" });
    } catch {
      /* refetch will restore if it failed */
    }
  }, []);

  const active = conversations.find((c) => c.id === activeId);
  const visible = conversations.filter((c) =>
    filter === "unread" ? c.unreadAdmin > 0 : filter === "read" ? c.unreadAdmin === 0 : filter === "important" ? c.important : true,
  );
  const filterCounts: Record<Filter, number> = {
    all: conversations.length,
    unread: conversations.filter((c) => c.unreadAdmin > 0).length,
    read: conversations.filter((c) => c.unreadAdmin === 0).length,
    important: conversations.filter((c) => c.important).length,
  };

  return (
    <div className="m-4 grid h-[calc(100dvh-96px)] grid-cols-[320px_1fr] grid-rows-[100%] overflow-hidden rounded-2xl border bg-white">
      {/* conversation list */}
      <div className="flex min-h-0 flex-col border-r">
        <div className="border-b">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="font-semibold">Conversations</h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
              {conversations.length}
            </span>
          </div>
          {/* filter tabs */}
          <div className="flex gap-1 px-3 pb-2.5">
            {(
              [
                ["all", "All"],
                ["unread", "New"],
                ["read", "Read"],
                ["important", "★"],
              ] as [Filter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                title={key === "important" ? "Important" : label}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${
                  filter === key
                    ? "bg-gradient-to-r from-[#a10140] to-[#c81a5e] text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                {label}
                {filterCounts[key] > 0 && key !== "all" && (
                  <span className="ml-1 opacity-70">{filterCounts[key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-400">
              {conversations.length === 0 ? "No conversations yet." : "Nothing in this filter."}
            </p>
          ) : (
            visible.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-neutral-50 ${
                  activeId === c.id ? "bg-pink-50" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-sm font-semibold text-white">
                  {label(c).slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      {c.important && <span className="shrink-0 text-[13px] leading-none text-amber-500">★</span>}
                      <span className="truncate font-medium text-[#202126]">{label(c)}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-neutral-400">{timeAgo(c.lastMessageAt)}</span>
                  </span>
                  <span className="truncate text-xs text-neutral-500">{c.email || "No email provided"}</span>
                </span>
                {c.unreadAdmin > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-600 px-1 text-[11px] font-bold text-white">
                    {c.unreadAdmin}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* conversation view */}
      <div className="flex min-h-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b px-5 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-sm font-semibold text-white">
                {label(active).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#202126]">{label(active)}</p>
                {active.email && (
                  <a href={`mailto:${active.email}`} className="text-xs text-pink-600">
                    {active.email}
                  </a>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => toggleAi(active.id, !active.aiEnabled)}
                  title={active.aiEnabled ? "IKORA is answering — click to take over" : "You have taken over — click to hand back to IKORA"}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                    active.aiEnabled
                      ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active.aiEnabled ? "bg-violet-500" : "bg-neutral-400"}`} />
                  {active.aiEnabled ? "IKORA on" : "IKORA off"}
                </button>
                <button
                  onClick={() => toggleImportant(active.id, !active.important)}
                  title={active.important ? "Remove from important" : "Mark as important"}
                  className={`rounded-lg p-2 text-[18px] leading-none transition ${
                    active.important ? "text-amber-500 hover:bg-amber-50" : "text-neutral-300 hover:bg-neutral-100 hover:text-amber-500"
                  }`}
                >
                  ★
                </button>
                <button
                  onClick={() => deleteConversation(active.id)}
                  title="Delete conversation"
                  aria-label="Delete conversation"
                  className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 px-5 py-4">
              {messages.map((m) => (
                <div key={m.id} className={m.sender === "visitor" ? "flex justify-start" : "flex justify-end"}>
                  <div className="max-w-[70%]">
                    {m.sender === "assistant" && (
                      <span className="mb-0.5 mr-1 block text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">
                        IKORA · AI
                      </span>
                    )}
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                        m.sender === "admin"
                          ? "rounded-br-md bg-wine-500 text-white"
                          : m.sender === "assistant"
                            ? "rounded-br-md bg-violet-50 text-[#202126] ring-1 ring-violet-200"
                            : "rounded-bl-md bg-white text-[#202126] shadow-sm ring-1 ring-black/5"
                      }`}
                    >
                      {m.body}
                      <span className={`mt-1 block text-[10px] ${m.sender === "admin" ? "text-white/60" : "text-neutral-400"}`}>
                        {new Date(m.createdAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex items-center gap-2 border-t px-4 py-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Reply as ${adminName}…`}
                className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-wine-500/20"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="rounded-full bg-wine-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-wine-600 disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-neutral-400">
            <span className="text-4xl">✉</span>
            <p className="mt-3 text-sm">Select a conversation to start replying</p>
          </div>
        )}
      </div>
    </div>
  );
}
