"use client";

import { useRef, useState, useTransition } from "react";
import type { HeroContent } from "@/cms/defaults";
import { publishHero, saveHeroDraft } from "./actions";

type Section = { id: string; name: string; type: string };

export default function EditorClient({ page, sections, initialHero, previewUrl }: { page: { id: string; title: string; slug: string; status: string }; sections: Section[]; initialHero: HeroContent; previewUrl: string }) {
  const hero = sections.find((item) => item.type === "hero");
  const [selected, setSelected] = useState(hero?.id ?? sections[0]?.id);
  const [content, setContent] = useState(initialHero);
  const [message, setMessage] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [pending, startTransition] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);
  const selectedSection = sections.find((item) => item.id === selected);
  const update = (key: keyof HeroContent, value: string) => setContent((old) => ({ ...old, [key]: value }));
  const save = () => hero && startTransition(async () => { await saveHeroDraft(hero.id, content); setMessage("Draft saved"); frame.current?.contentWindow?.location.reload(); });
  const publish = () => hero && startTransition(async () => { await saveHeroDraft(hero.id, content); await publishHero(hero.id); setMessage("Published live"); frame.current?.contentWindow?.location.reload(); });

  return <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[260px_minmax(500px,1fr)_320px]">
    <aside className="border-r border-white/10 bg-[#17181d] p-4"><h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Navigator</h2><div className="mb-3 rounded-lg bg-pink-500/15 px-3 py-2 text-sm font-medium">Page · {page.title}</div><div className="space-y-1">{sections.map((section) => <button key={section.id} onClick={() => setSelected(section.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${selected === section.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}><span className="text-white/30">⋮⋮</span>{section.name}<span className="ml-auto text-white/20">•••</span></button>)}</div><button className="mt-4 w-full rounded-lg border border-dashed border-white/20 p-3 text-sm text-white/50">+ Add section</button></aside>
    <section className="overflow-hidden bg-[#25262c] p-5"><div className="mb-4 flex items-center justify-between"><div className="flex gap-2 rounded-lg bg-black/30 p-1 text-xs">{(["desktop","tablet","mobile"] as const).map((item) => <button key={item} onClick={() => setDevice(item)} className={`rounded px-3 py-1.5 capitalize ${device === item ? "bg-white/10 text-white" : "text-white/55"}`}>{item}</button>)}</div><span className="text-xs text-white/40">Real page · draft preview · {device}</span></div><div className="flex h-[calc(100vh-9rem)] justify-center overflow-auto"><div className="h-full overflow-hidden rounded-xl bg-white shadow-2xl transition-[width] duration-300" style={{ width: device === "desktop" ? "100%" : device === "tablet" ? 768 : 390 }}><iframe ref={frame} title="Draft website preview" src={previewUrl} className="h-full w-full border-0" /></div></div></section>
    <aside className="overflow-y-auto border-l border-white/10 bg-[#17181d] p-5"><h2 className="text-lg font-semibold">{selectedSection?.name ?? "Settings"}</h2><div className="mt-5 flex gap-4 border-b border-white/10 text-xs text-white/50"><span className="border-b-2 border-pink-400 pb-3 text-white">Content</span><span>Style</span><span>Advanced</span></div>{selectedSection?.type === "hero" ? <div className="mt-5 space-y-4">{([['heading','Heading'],['description','Description'],['primaryLabel','Primary button'],['primaryLink','Primary link'],['secondaryLabel','Secondary button'],['secondaryLink','Secondary link'],['video','Video URL']] as [keyof HeroContent,string][]).map(([key,label]) => <label key={key} className="block text-xs text-white/50">{label}{key === "description" ? <textarea value={content[key]} onChange={(e) => update(key,e.target.value)} className="admin-input mt-2 min-h-24" /> : <input value={content[key]} onChange={(e) => update(key,e.target.value)} className="admin-input mt-2" />}</label>)}<div className="grid grid-cols-2 gap-2"><button disabled={pending} onClick={save} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Save draft</button><button disabled={pending} onClick={publish} className="admin-button">Publish</button></div>{message && <p className="text-center text-xs text-emerald-300">{message}</p>}</div> : <p className="mt-6 text-sm leading-6 text-white/45">This section is next in the conversion queue. Select Hero to use the working draft and publish controls.</p>}</aside>
  </div>;
}
