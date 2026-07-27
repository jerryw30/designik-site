"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playChime, playRing } from "@/lib/chime";
import { Linkified } from "@/components/ui/Linkify";

type Conversation = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  important: boolean;
  aiEnabled: boolean;
  rating: number | null;
  unreadAdmin: number;
  lastMessageAt: string;
  createdAt: string;
};

type Filter = "all" | "unread" | "read" | "important";
type Msg = { id: string; sender: "visitor" | "admin" | "assistant"; senderName?: string | null; body: string; createdAt: string };

const RING_MUTE_KEY = "designik_chat_ring_muted";

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
  const [ringMuted, setRingMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  // restore ring-mute preference
  useEffect(() => {
    setRingMuted(localStorage.getItem(RING_MUTE_KEY) === "1");
  }, []);
  const toggleRingMuted = useCallback(() => {
    setRingMuted((v) => {
      localStorage.setItem(RING_MUTE_KEY, v ? "0" : "1");
      return !v;
    });
  }, []);

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

  // Conversations this team member has opened — their ring stops for those
  // even before they reply (other members keep ringing until they open it).
  const ackWaiting = useRef<Set<string>>(new Set());

  const openConversation = useCallback(
    (id: string) => {
      ackWaiting.current.add(id);
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

  const deliverReply = useCallback(
    async (text: string) => {
      if (!text || !activeId || sending) return;
      setSending(true);
      const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "admin", senderName: adminName, body: text, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await fetch(`/api/admin/chat/${activeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const data = await res.json();
        if (data.message) setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
        // The server disables IKORA + clears the WAITING queue on human
        // reply — mirror both locally (also stops the ringing).
        setConversations((prev) => prev.map((c) => (c.id === activeId ? { ...c, aiEnabled: false, status: "OPEN" } : c)));
        loadConversations();
      } catch {
        /* keep optimistic */
      } finally {
        setSending(false);
      }
    },
    [activeId, sending, adminName, loadConversations],
  );

  const send = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = reply.trim();
      if (!text) return;
      setReply("");
      deliverReply(text);
    },
    [reply, deliverReply],
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

  // Someone is in line waiting for a human — ring like an incoming call
  // until this member opens the chat, a reply flips status to OPEN, or the
  // sound is muted.
  const anyWaiting = conversations.some((c) => c.status === "WAITING" && !ackWaiting.current.has(c.id));
  useEffect(() => {
    if (!anyWaiting || ringMuted) return;
    playRing();
    const id = setInterval(playRing, 3200);
    return () => clearInterval(id);
  }, [anyWaiting, ringMuted]);

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
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleRingMuted}
                title={ringMuted ? "Ring sound is OFF — click to enable" : "Ring sound is ON — click to mute"}
                className={`rounded-lg p-1.5 transition ${
                  ringMuted
                    ? "text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500"
                    : anyWaiting
                      ? "animate-pulse bg-emerald-50 text-emerald-600"
                      : "text-neutral-400 hover:bg-neutral-100"
                }`}
              >
                {ringMuted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path d="M18.63 13A17.9 17.9 0 0 1 18 8a6 6 0 0 0-9.33-5" />
                    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                    <path d="m2 2 20 20" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                )}
              </button>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                {conversations.length}
              </span>
            </div>
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
                  <span className="flex items-center gap-1.5 truncate text-xs text-neutral-500">
                    {c.status === "WAITING" && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px font-semibold text-emerald-600">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                        In line
                      </span>
                    )}
                    {c.rating != null && (
                      <span className="shrink-0 rounded bg-amber-50 px-1 font-medium text-amber-600">★ {c.rating}</span>
                    )}
                    <span className="truncate">{c.email || "No email provided"}</span>
                  </span>
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
                      className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                        m.sender === "admin"
                          ? "rounded-br-md bg-wine-500 text-white"
                          : m.sender === "assistant"
                            ? "rounded-br-md bg-violet-50 text-[#202126] ring-1 ring-violet-200"
                            : "rounded-bl-md bg-white text-[#202126] shadow-sm ring-1 ring-black/5"
                      }`}
                    >
                      <Linkified text={m.body} linkClass={m.sender === "admin" ? "text-white" : "text-wine-500"} />
                      <span className={`mt-1 block text-[10px] ${m.sender === "admin" ? "text-white/60" : "text-neutral-400"}`}>
                        {m.sender === "admin" && m.senderName ? `${m.senderName} · ` : ""}
                        {new Date(m.createdAt).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {active.status === "WAITING" && (
              <div className="border-t bg-emerald-50/70 px-4 py-2.5">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Visitor is in line — suggested intro, one click to send
                </p>
                <button
                  onClick={() =>
                    deliverReply(
                      `Hi${active.name ? ` ${active.name}` : ""}, I'm ${adminName} from the Designik team. Give me a minute to read through your chat so I can catch up on what you need, and I'll be right with you.`,
                    )
                  }
                  disabled={sending}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-left text-[13px] leading-snug text-neutral-700 transition hover:border-emerald-400 hover:shadow-sm disabled:opacity-50"
                >
                  <span>
                    Hi{active.name ? ` ${active.name}` : ""}, I&rsquo;m {adminName} from the Designik team. Give me a
                    minute to read through your chat so I can catch up on what you need, and I&rsquo;ll be right with
                    you.
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition group-hover:scale-105">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                      <path d="M4 12l16-8-6 16-3-6-7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            )}
            <form onSubmit={send} className={`flex items-center gap-2 px-4 py-3 ${active.status === "WAITING" ? "" : "border-t"}`}>
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
