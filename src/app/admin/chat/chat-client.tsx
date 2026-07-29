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
  countryCode: string | null;
  city: string | null;
  ip: string | null;
  unreadAdmin: number;
  lastMessageAt: string;
  createdAt: string;
};

type Filter = "all" | "unread" | "read" | "important" | "spam";
type ChatSettings = { enabled: boolean; teaser: boolean; sound: boolean };
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

/** Country code → flag emoji (regional indicator letters). */
function flagEmoji(code: string | null | undefined) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

const COUNTRY_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;
function countryName(code: string | null | undefined) {
  if (!code) return "";
  try {
    return COUNTRY_NAMES?.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Where the visitor is chatting from, e.g. "🇺🇸 Pittsburgh, United States". */
function geoLabel(c: Conversation) {
  if (!c.countryCode) return "";
  const flag = flagEmoji(c.countryCode);
  const place = [c.city, countryName(c.countryCode)].filter(Boolean).join(", ");
  return `${flag} ${place}`.trim();
}

function label(c: Conversation) {
  const named = c.name?.trim() || c.email?.trim();
  if (named) return named;
  // Anonymous visitor — show where they're from instead of a random code.
  return geoLabel(c) || `Visitor ${c.id.slice(0, 6)}`;
}

/** Avatar text: initials for named visitors, their flag for anonymous ones. */
function initials(c: Conversation) {
  const named = c.name?.trim() || c.email?.trim();
  if (named) return named.slice(0, 2).toUpperCase();
  return flagEmoji(c.countryCode) || "V";
}

export default function ChatClient({ adminName }: { adminName: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [ringMuted, setRingMuted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  // restore ring-mute preference
  useEffect(() => {
    setRingMuted(localStorage.getItem(RING_MUTE_KEY) === "1");
  }, []);

  // site-wide chat settings (enable/disable etc.)
  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c?.chat && setChatSettings(c.chat))
      .catch(() => {});
  }, []);
  const saveChatSettings = useCallback(async (patch: Partial<ChatSettings>) => {
    setChatSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setSettingsSaving(true);
    try {
      await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat: patch }),
      });
    } catch {
      /* optimistic */
    } finally {
      setSettingsSaving(false);
    }
  }, []);

  // bulk selection + actions
  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const bulkAction = useCallback(
    async (action: "delete" | "spam" | "not-spam" | "read") => {
      const ids = [...selected];
      if (!ids.length) return;
      if (action === "delete" && !window.confirm(`Delete ${ids.length} conversation${ids.length > 1 ? "s" : ""} permanently?`)) return;
      setSelected(new Set());
      setConversations((prev) =>
        action === "delete"
          ? prev.filter((c) => !ids.includes(c.id))
          : prev.map((c) =>
              ids.includes(c.id)
                ? {
                    ...c,
                    ...(action === "spam" ? { status: "SPAM", aiEnabled: false, unreadAdmin: 0 } : {}),
                    ...(action === "not-spam" ? { status: "OPEN" } : {}),
                    ...(action === "read" ? { unreadAdmin: 0 } : {}),
                  }
                : c,
            ),
      );
      if (action === "delete" && activeRef.current && ids.includes(activeRef.current)) {
        setActiveId(null);
        setMessages([]);
      }
      try {
        await fetch("/api/admin/chat/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action }),
        });
      } catch {
        /* the poll re-syncs */
      }
    },
    [selected],
  );
  const setSpam = useCallback(async (id: string, spam: boolean) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: spam ? "SPAM" : "OPEN", ...(spam ? { aiEnabled: false, unreadAdmin: 0 } : {}) } : c)),
    );
    try {
      await fetch(`/api/admin/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: spam ? "SPAM" : "OPEN" }),
      });
    } catch {
      /* optimistic */
    }
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
  const notSpam = conversations.filter((c) => c.status !== "SPAM");
  const visible =
    filter === "spam"
      ? conversations.filter((c) => c.status === "SPAM")
      : notSpam.filter((c) =>
          filter === "unread" ? c.unreadAdmin > 0 : filter === "read" ? c.unreadAdmin === 0 : filter === "important" ? c.important : true,
        );
  const filterCounts: Record<Filter, number> = {
    all: notSpam.length,
    unread: notSpam.filter((c) => c.unreadAdmin > 0).length,
    read: notSpam.filter((c) => c.unreadAdmin === 0).length,
    important: notSpam.filter((c) => c.important).length,
    spam: conversations.filter((c) => c.status === "SPAM").length,
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
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                title="Chat settings"
                className={`rounded-lg p-1.5 transition ${settingsOpen ? "bg-neutral-100 text-neutral-600" : "text-neutral-400 hover:bg-neutral-100"}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                {conversations.length}
              </span>
            </div>
          </div>

          {/* chat settings */}
          {settingsOpen && (
            <div className="space-y-2.5 border-b bg-neutral-50 px-5 py-3.5">
              {chatSettings === null ? (
                <p className="text-[12px] text-neutral-400">Loading settings…</p>
              ) : (
                <>
                  {(
                    [
                      ["enabled", "Chat widget on the website", "Turns the whole chat bubble on or off for visitors"],
                      ["teaser", "Message preview bubble", "The small preview that pops up next to the chat bubble"],
                      ["sound", "Visitor sound", "Chime on the visitor side when a reply arrives"],
                    ] as [keyof ChatSettings, string, string][]
                  ).map(([key, title, sub]) => (
                    <label key={key} className="flex cursor-pointer items-center justify-between gap-3">
                      <span>
                        <span className="block text-[12.5px] font-medium text-[#202126]">{title}</span>
                        <span className="block text-[11px] text-neutral-400">{sub}</span>
                      </span>
                      <button
                        role="switch"
                        aria-checked={chatSettings[key]}
                        onClick={() => saveChatSettings({ [key]: !chatSettings[key] })}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition ${chatSettings[key] ? "bg-emerald-500" : "bg-neutral-300"}`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${chatSettings[key] ? "left-[18px]" : "left-0.5"}`}
                        />
                      </button>
                    </label>
                  ))}
                  <p className="text-[11px] text-neutral-400">
                    {settingsSaving ? "Saving…" : "Changes go live within a minute. Booking link & phone: Popups screen."}
                  </p>
                </>
              )}
            </div>
          )}

          {/* bulk actions for selected conversations */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b bg-pink-50/60 px-4 py-2">
              <span className="text-[12px] font-semibold text-[#a10140]">{selected.size} selected</span>
              <button onClick={() => bulkAction("read")} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50">
                Mark read
              </button>
              {filter === "spam" ? (
                <button onClick={() => bulkAction("not-spam")} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50">
                  Not spam
                </button>
              ) : (
                <button onClick={() => bulkAction("spam")} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-amber-600 ring-1 ring-amber-200 hover:bg-amber-50">
                  Spam
                </button>
              )}
              <button onClick={() => bulkAction("delete")} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-auto text-[11.5px] text-neutral-400 hover:text-neutral-600">
                Clear
              </button>
            </div>
          )}
          {/* filter tabs */}
          <div className="flex gap-1 px-3 pb-2.5">
            {(
              [
                ["all", "All"],
                ["unread", "New"],
                ["read", "Read"],
                ["important", "★"],
                ["spam", "Spam"],
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
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => openConversation(c.id)}
                onKeyDown={(e) => e.key === "Enter" && openConversation(c.id)}
                className={`flex w-full cursor-pointer items-center gap-2.5 border-b px-3 py-3 text-left transition hover:bg-neutral-50 ${
                  activeId === c.id ? "bg-pink-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelected(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${label(c)}`}
                  className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#a10140]"
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-sm font-semibold text-white">
                  {initials(c)}
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
              </div>
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
                {initials(active)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#202126]">{label(active)}</p>
                <p className="flex items-center gap-2 text-xs">
                  {active.email && (
                    <a href={`mailto:${active.email}`} className="text-pink-600">
                      {active.email}
                    </a>
                  )}
                  {geoLabel(active) && (active.name?.trim() || active.email?.trim()) && (
                    <span className="text-neutral-500" title={active.ip ? `IP: ${active.ip}` : undefined}>
                      {geoLabel(active)}
                    </span>
                  )}
                </p>
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
                  onClick={() => setSpam(active.id, active.status !== "SPAM")}
                  title={active.status === "SPAM" ? "Not spam — reopen this conversation" : "Mark as spam (blocks further messages)"}
                  className={`rounded-lg p-2 transition ${
                    active.status === "SPAM" ? "bg-amber-50 text-amber-600" : "text-neutral-400 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden>
                    <path d="M12 2 2 7v6c0 5 4 8 10 9 6-1 10-4 10-9V7l-10-5Z" />
                    <path d="m5 5 14 14" />
                  </svg>
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
