"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { playChime } from "@/lib/chime";
import { Linkified } from "@/components/ui/Linkify";
import CalendlyModal from "@/components/ui/CalendlyModal";

type Msg = { id: string; sender: "visitor" | "admin" | "assistant"; senderName?: string | null; body: string; createdAt: string };
type Mode = "chat" | "team" | "rating" | "ended";

// Quick actions appear per intent — the team chip when the visitor wants a
// person, the meeting chip when they want a call with Luke. Each hides
// again once clicked.
const TEAM_INTENT_RE =
  /(real person|human|someone|team|agent|support|speak|talk to|contact|representative|quote|proposal|hire)/i;
const MEET_INTENT_RE = /(meeting|meet with|meet luke|call|schedule|book|calendly|appointment|luke)/i;

const STORAGE_KEY = "designik_chat_conversation";
const CALENDLY_URL = "https://calendly.com/luke-designingenious/";
const CALL_TEL = "tel:+14122061270";
const CALL_DISPLAY = "412-206-1270";
const GREETING: Msg = {
  id: "greeting",
  sender: "assistant",
  body: "Hey, I'm IKORA, Designik's AI project concierge. I can help you figure out the right direction for your website, app, brand, marketing, or automation project. What are you looking to build or improve?",
  createdAt: "",
};

/** IKORA's avatar — her portrait, in a brand-gradient ring. */
function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full p-[2px] shadow-sm"
      style={{ width: size, height: size, backgroundImage: "linear-gradient(135deg, #a10140 0%, #db2f73 100%)" }}
    >
      <Image
        src="/api/static/ikora-avatar-2.png"
        alt="IKORA"
        width={size - 4}
        height={size - 4}
        className="h-full w-full rounded-full object-cover"
      />
    </span>
  );
}

/** Human team avatar (Designik mark). */
function TeamAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine-500 shadow-sm">
      <Image src={assets.logo} alt="" width={14} height={14} className="h-3.5 w-3.5" />
    </span>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [typing, setTyping] = useState(false); // IKORA is composing a reply
  const [sendError, setSendError] = useState(false);
  const [team, setTeam] = useState({ name: "", email: "" });
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [hoverStar, setHoverStar] = useState(0);
  const [showTeam, setShowTeam] = useState(false); // talk-to-team chip
  const [showMeet, setShowMeet] = useState(false); // meet-with-Luke chip
  const [waitingHuman, setWaitingHuman] = useState(false); // in line for the team
  const [calendlyOpen, setCalendlyOpen] = useState(false); // on-site booking popup
  // Admin-controlled settings (chat on/off, teaser, booking link, phone)
  const [config, setConfig] = useState({ enabled: true, teaser: true, sound: true, calendlyUrl: CALENDLY_URL, phone: CALL_DISPLAY });
  const configRef = useRef(config);
  configRef.current = config;
  const [teaserReady, setTeaserReady] = useState(false); // small entrance delay
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const convId = useRef<string | null>(null);
  const lastTs = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set([GREETING.id]));
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // restore conversation id
  useEffect(() => {
    convId.current = localStorage.getItem(STORAGE_KEY);
  }, []);

  // admin-controlled chat settings
  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!c) return;
        setConfig({
          enabled: c.chat?.enabled !== false,
          teaser: c.chat?.teaser !== false,
          sound: c.chat?.sound !== false,
          calendlyUrl: c.calendlyUrl || CALENDLY_URL,
          phone: c.phone || CALL_DISPLAY,
        });
      })
      .catch(() => {});
  }, []);

  // teaser slides in shortly after the page loads
  useEffect(() => {
    const t = setTimeout(() => setTeaserReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  const poll = useCallback(async () => {
    if (!convId.current || mode === "ended") return;
    try {
      const url = `/api/chat?conversationId=${convId.current}${lastTs.current ? `&after=${encodeURIComponent(lastTs.current)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      const incoming: Msg[] = data.messages || [];
      if (incoming.length) {
        lastTs.current = incoming[incoming.length - 1].createdAt;
        const fresh = incoming.filter((m) => !knownIds.current.has(m.id));
        if (fresh.length) {
          fresh.forEach((m) => knownIds.current.add(m.id));
          const teamMsgs = fresh.filter((m) => m.sender !== "visitor").length;
          if (teamMsgs > 0) {
            if (configRef.current.sound) playChime();
            if (!open) {
              setUnread((u) => u + teamMsgs);
              setTeaserDismissed(false); // new message re-surfaces the teaser
            }
            // The awaited reply arrived — stop the typing indicator.
            setTyping(false);
            if (typingTimer.current) clearTimeout(typingTimer.current);
          }
          // A real person joined — the visitor is out of the queue.
          if (fresh.some((m) => m.sender === "admin")) setWaitingHuman(false);
          // IKORA offered the handoff/booking — surface the matching action.
          const assistantText = fresh.filter((m) => m.sender === "assistant").map((m) => m.body).join(" ");
          if (assistantText) {
            if (assistantText.includes("calendly.com") || MEET_INTENT_RE.test(assistantText)) setShowMeet(true);
            if (TEAM_INTENT_RE.test(assistantText)) setShowTeam(true);
          }
          setMessages((prev) => [...prev, ...fresh]);
        }
      }
    } catch {
      /* ignore poll errors */
    }
  }, [open, mode]);

  // poll loop (faster when open)
  useEffect(() => {
    poll();
    const id = setInterval(poll, open ? 3000 : 12000);
    return () => clearInterval(id);
  }, [poll, open]);

  // opening: clear unread + jump to the latest message
  useEffect(() => {
    if (open) {
      setUnread(0);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }, [open]);

  // new messages: follow only when already near the bottom — don't yank
  // the visitor down while they're scrolled up reading
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight }));
  }, [messages, open, typing, sendError, mode]);

  /** Deliver a message (typed or from a quick action). */
  const deliver = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || sending) return;
      setSending(true);
      setSendError(false);
      // Visitor wants to reach a person / book a meeting — show the match.
      if (TEAM_INTENT_RE.test(body)) setShowTeam(true);
      if (MEET_INTENT_RE.test(body)) setShowMeet(true);
      const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "visitor", body, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId.current, body }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.conversationId) {
          convId.current = data.conversationId;
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        }
        if (data.message) {
          lastTs.current = data.message.createdAt;
          knownIds.current.add(data.message.id);
          setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
        }
        // Server says IKORA is composing — show typing until the reply
        // arrives via poll (or give up after 60s and let a human follow up).
        if (data.aiActive) {
          setTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setTyping(false), 60000);
        }
      } catch {
        // Keep the optimistic bubble but tell the visitor it didn't go through.
        setSendError(true);
      } finally {
        setSending(false);
      }
    },
    [sending],
  );

  const send = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      setInput("");
      deliver(text);
    },
    [input, deliver],
  );

  /** Submit the connect-with-team form. */
  const connectTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (teamBusy) return;
      setTeamBusy(true);
      setTeamError("");
      try {
        const res = await fetch("/api/chat/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId.current, name: team.name, email: team.email }),
          signal: AbortSignal.timeout(20000),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Something went wrong.");
        if (data.conversationId) {
          convId.current = data.conversationId;
          localStorage.setItem(STORAGE_KEY, data.conversationId);
        }
        setTyping(false);
        setWaitingHuman(true); // in line until a team member replies
        setShowTeam(false);
        setMode("chat");
        // Poll picks up the marker + confirmation messages.
        poll();
      } catch (err) {
        setTeamError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        setTeamBusy(false);
      }
    },
    [team, teamBusy, poll],
  );

  /** End the chat, optionally with a star rating. */
  const endChat = useCallback(async (rating?: number) => {
    try {
      if (convId.current) {
        await fetch("/api/chat/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId.current, rating }),
          signal: AbortSignal.timeout(10000),
        });
      }
    } catch {
      /* ending is best-effort */
    }
    setMode("ended");
  }, []);

  /** Fresh conversation after ending. */
  const startNewChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    convId.current = null;
    lastTs.current = null;
    knownIds.current = new Set([GREETING.id]);
    setMessages([GREETING]);
    setTyping(false);
    setSendError(false);
    setTeam({ name: "", email: "" });
    setHoverStar(0);
    setShowTeam(false);
    setShowMeet(false);
    setWaitingHuman(false);
    setMode("chat");
  }, []);

  // Latest message from IKORA / the team — previewed in the teaser bubble
  // (falls back to the greeting on a fresh visit; survives refresh because
  // the poll reloads the conversation history).
  const lastIncoming = [...messages].reverse().find((m) => m.sender !== "visitor");

  // Chat switched off from the admin — render nothing at all.
  if (!config.enabled) return null;

  return (
    <>
      {/* teaser bubble — visible while the chat is closed */}
      <AnimatePresence>
        {config.teaser && teaserReady && !open && !teaserDismissed && mode !== "ended" && lastIncoming && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(true)}
            role="button"
            aria-label="Open chat"
            className="fixed bottom-24 right-6 z-[99] w-[calc(100vw-48px)] max-w-[300px] cursor-pointer rounded-2xl bg-white p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] ring-1 ring-black/5 transition-transform hover:scale-[1.02]"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTeaserDismissed(true);
              }}
              aria-label="Dismiss"
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-700 text-white shadow transition hover:bg-neutral-900"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
                <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-start gap-2.5">
              <BotAvatar size={34} />
              <div className="min-w-0">
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                  {lastIncoming.sender === "assistant" ? "IKORA" : lastIncoming.senderName || "Designik Team"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink">{lastIncoming.body}</p>
                <p className="mt-1 text-[11px] font-medium text-wine-500">Click to reply</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* launcher */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open chat"}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-wine-500 text-white shadow-[0_10px_30px_rgba(83,8,35,0.5)] transition-transform duration-300 hover:scale-110 active:scale-95"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </motion.svg>
            ) : (
              <motion.svg key="chat" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M8.5 9.5h7M8.5 12h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </motion.svg>
            )}
          </AnimatePresence>
          {!open && unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-wine-500 ring-2 ring-wine-500">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[100] flex h-[660px] max-h-[calc(100dvh-120px)] w-[calc(100vw-48px)] max-w-[430px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          >
            {/* header */}
            <div
              className="relative flex items-center gap-3 px-5 py-4 text-white"
              style={{ backgroundImage: "linear-gradient(135deg, #8e0038 0%, #a10140 60%, #c4136a 130%)" }}
            >
              <BotAvatar size={40} />
              <div className="flex-1">
                <p className="font-display text-[15px] font-semibold uppercase leading-tight">Designik Chat</p>
                <p className="flex items-center gap-1.5 text-[12px] text-white/75">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> IKORA is online
                </p>
              </div>
              {mode !== "ended" && (
                <button
                  onClick={() => setMode(mode === "rating" ? "chat" : "rating")}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/90 transition hover:bg-white/25"
                >
                  {mode === "rating" ? "Back" : "End chat"}
                </button>
              )}
            </div>

            {/* messages — Calendly links open the on-site booking popup */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              onClickCapture={(e) => {
                const a = (e.target as HTMLElement).closest("a");
                if (a && a.href.includes("calendly.com")) {
                  e.preventDefault();
                  setCalendlyOpen(true);
                }
              }}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 px-4 py-4"
            >
              {messages.map((m) => (
                <div key={m.id} className={m.sender === "visitor" ? "flex justify-end" : "flex justify-start"}>
                  {m.sender === "visitor" ? (
                    <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-wine-500 px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
                      <Linkified text={m.body} linkClass="text-white" />
                    </div>
                  ) : (
                    <div className="flex max-w-[86%] items-end gap-2">
                      {m.sender === "assistant" ? <BotAvatar /> : <TeamAvatar />}
                      <div className="min-w-0">
                        <span className="mb-0.5 ml-1 block font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                          {m.sender === "assistant" ? "IKORA" : m.senderName || "Designik Team"}
                        </span>
                        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-ink shadow-sm ring-1 ring-black/5">
                          <Linkified text={m.body} linkClass="text-wine-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* IKORA typing indicator */}
              {typing && mode === "chat" && (
                <div className="flex items-end gap-2">
                  <BotAvatar />
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-300 [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* send failure notice */}
              {sendError && (
                <p className="px-2 text-center text-[12px] text-red-400">
                  Your message could not be sent. Please check your connection and try again.
                </p>
              )}

              {/* connect-with-team form */}
              {mode === "team" && (
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <p className="font-display text-[13px] font-semibold uppercase text-ink">Talk to a real person</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Leave your details and the team will reply right here or by email.
                  </p>
                  <form onSubmit={connectTeam} className="mt-3 space-y-2">
                    <input
                      value={team.name}
                      onChange={(e) => setTeam((t) => ({ ...t, name: e.target.value }))}
                      placeholder="Your name"
                      required
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-neutral-400 focus:border-wine-500"
                    />
                    <input
                      type="email"
                      value={team.email}
                      onChange={(e) => setTeam((t) => ({ ...t, email: e.target.value }))}
                      placeholder="Email address"
                      required
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-neutral-400 focus:border-wine-500"
                    />
                    {teamError && <p className="text-[12px] text-red-500">{teamError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={teamBusy}
                        className="flex-1 rounded-full bg-wine-500 py-2.5 font-display text-[12px] font-semibold uppercase text-white transition hover:brightness-110 disabled:opacity-50"
                      >
                        {teamBusy ? "Connecting…" : "Connect me"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("chat")}
                        className="rounded-full border border-neutral-200 px-4 py-2.5 font-display text-[12px] font-semibold uppercase text-neutral-500 transition hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* rating card */}
              {mode === "rating" && (
                <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
                  <p className="font-display text-[13px] font-semibold uppercase text-ink">Before you go…</p>
                  <p className="mt-1 text-[12px] text-neutral-500">How was your chat with IKORA?</p>
                  <div className="mt-2 flex justify-center gap-1" onMouseLeave={() => setHoverStar(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => endChat(n)}
                        onMouseEnter={() => setHoverStar(n)}
                        aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                        className={`text-[26px] leading-none transition-transform hover:scale-110 ${
                          n <= hoverStar ? "text-amber-400" : "text-neutral-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => endChat()}
                    className="mt-2 text-[12px] text-neutral-400 underline underline-offset-2 hover:text-neutral-600"
                  >
                    Skip and end chat
                  </button>
                </div>
              )}

              {/* ended card */}
              {mode === "ended" && (
                <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-black/5">
                  <p className="font-display text-[13px] font-semibold uppercase text-ink">Chat ended</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Thanks for stopping by! The team can still reach you by email if you left your details.
                  </p>
                  <button
                    onClick={startNewChat}
                    className="mt-3 rounded-full bg-wine-500 px-6 py-2.5 font-display text-[12px] font-semibold uppercase text-white transition hover:brightness-110"
                  >
                    Start a new chat
                  </button>
                </div>
              )}
            </div>

            {/* quick actions + input */}
            {mode === "chat" && (
              <>
                {waitingHuman && (
                  <div className="flex items-center justify-center gap-2 border-t bg-emerald-50 px-3 py-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <p className="text-[12px] font-medium text-emerald-700">
                      You&rsquo;re in line — a team member will join shortly
                    </p>
                  </div>
                )}
                {(showTeam || showMeet) && !waitingHuman && (
                <div className="flex gap-2 border-t bg-white px-3 pt-2.5">
                  {showTeam && (
                  <button
                    onClick={() => {
                      setShowTeam(false); // one-shot suggestion
                      setMode("team");
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-wine-500/25 bg-wine-500/5 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <circle cx="9.5" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M17.2 11.2a3.2 3.2 0 1 0-2.4-5.7M21 19v-1a4 4 0 0 0-3-3.85" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Talk to the team
                  </button>
                  )}
                  {showMeet && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMeet(false); // one-shot suggestion
                      setCalendlyOpen(true);
                    }}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-wine-500/25 bg-wine-500/5 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M3.5 9.5h17M8 2.8V6M16 2.8V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="m9.5 14.5 1.8 1.8 3.4-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Meet with Luke
                  </button>
                  )}
                  <a
                    href={config.phone.replace(/\D/g, "").length === 10 ? `tel:+1${config.phone.replace(/\D/g, "")}` : CALL_TEL}
                    title={`Call ${config.phone}`}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-wine-500/25 bg-wine-500/5 px-3 py-2 font-display text-[11px] font-semibold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
                      <path
                        d="M5.5 4h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Call
                  </a>
                </div>
                )}
                <form onSubmit={send} className={`flex items-center gap-2 bg-white px-3 py-3 ${!(showTeam || showMeet) && !waitingHuman ? "border-t" : ""}`}>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message…"
                    aria-label="Message"
                    className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-[14px] text-ink outline-none placeholder:text-neutral-400 focus:bg-neutral-50 focus:ring-2 focus:ring-wine-500/20"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Send"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-wine-500 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                      <path d="M4 12l16-8-6 16-3-6-7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CalendlyModal open={calendlyOpen} onClose={() => setCalendlyOpen(false)} url={config.calendlyUrl} />
    </>
  );
}
