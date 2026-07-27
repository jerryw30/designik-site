"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { assets } from "@/lib/assets";
import { playChime } from "@/lib/chime";

type Msg = { id: string; sender: "visitor" | "admin" | "assistant"; body: string; createdAt: string };

const STORAGE_KEY = "designik_chat_conversation";
const GREETING: Msg = {
  id: "greeting",
  sender: "assistant",
  body: "Hey, I'm IKORA, Designik's AI project concierge. I can help you figure out the right direction for your website, app, brand, marketing, or automation project. What are you looking to build or improve?",
  createdAt: "",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const convId = useRef<string | null>(null);
  const lastTs = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string>>(new Set([GREETING.id]));

  // restore conversation id
  useEffect(() => {
    convId.current = localStorage.getItem(STORAGE_KEY);
  }, []);

  const poll = useCallback(async () => {
    if (!convId.current) return;
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
            playChime();
            if (!open) setUnread((u) => u + teamMsgs);
          }
          setMessages((prev) => [...prev, ...fresh]);
        }
      }
    } catch {
      /* ignore poll errors */
    }
  }, [open]);

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
  }, [messages, open]);

  const send = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || sending) return;
      setSending(true);
      const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "visitor", body: text, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, optimistic]);
      setInput("");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId.current, body: text }),
        });
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
      } catch {
        /* keep optimistic message */
      } finally {
        setSending(false);
      }
    },
    [input, sending],
  );

  return (
    <>
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
            className="fixed bottom-24 right-6 z-[100] flex h-[500px] max-h-[calc(100dvh-120px)] w-[calc(100vw-48px)] max-w-[380px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          >
            {/* header */}
            <div
              className="relative flex items-center gap-3 px-5 py-4 text-white"
              style={{ backgroundImage: "linear-gradient(135deg, #8e0038 0%, #a10140 60%, #c4136a 130%)" }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Image src={assets.logo} alt="" width={22} height={22} className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="font-display text-[15px] font-semibold uppercase leading-tight">Designik Chat</p>
                <p className="flex items-center gap-1.5 text-[12px] text-white/75">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> IKORA is online
                </p>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={m.sender === "visitor" ? "flex justify-end" : "flex justify-start"}>
                  <div className={m.sender === "visitor" ? "max-w-[78%]" : "max-w-[78%]"}>
                    {m.sender !== "visitor" && (
                      <span className="mb-0.5 ml-1 block font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                        {m.sender === "assistant" ? "IKORA" : "Designik Team"}
                      </span>
                    )}
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                        m.sender === "visitor"
                          ? "rounded-br-md bg-wine-500 text-white"
                          : "rounded-bl-md bg-white text-ink shadow-sm ring-1 ring-black/5"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* input */}
            <form onSubmit={send} className="flex items-center gap-2 border-t bg-white px-3 py-3">
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
