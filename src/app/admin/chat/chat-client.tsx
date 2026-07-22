"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playChime } from "@/lib/chime";

type Conversation = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  unreadAdmin: number;
  lastMessageAt: string;
  createdAt: string;
};
type Msg = { id: string; sender: "visitor" | "admin"; body: string; createdAt: string };

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
        loadConversations();
      } catch {
        /* keep optimistic */
      } finally {
        setSending(false);
      }
    },
    [reply, activeId, sending, loadConversations],
  );

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="m-4 grid h-[calc(100dvh-96px)] grid-cols-[320px_1fr] grid-rows-[100%] overflow-hidden rounded-2xl border bg-white">
      {/* conversation list */}
      <div className="flex min-h-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Conversations</h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            {conversations.length}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {conversations.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-400">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
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
                    <span className="truncate font-medium text-[#202126]">{label(c)}</span>
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
              <div>
                <p className="font-semibold text-[#202126]">{label(active)}</p>
                {active.email && (
                  <a href={`mailto:${active.email}`} className="text-xs text-pink-600">
                    {active.email}
                  </a>
                )}
              </div>
            </div>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 px-5 py-4">
              {messages.map((m) => (
                <div key={m.id} className={m.sender === "admin" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                      m.sender === "admin"
                        ? "rounded-br-md bg-wine-500 text-white"
                        : "rounded-bl-md bg-white text-[#202126] shadow-sm ring-1 ring-black/5"
                    }`}
                  >
                    {m.body}
                    <span className={`mt-1 block text-[10px] ${m.sender === "admin" ? "text-white/60" : "text-neutral-400"}`}>
                      {new Date(m.createdAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
                    </span>
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
