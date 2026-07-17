"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { HeroContent } from "@/cms/defaults";
import { newWidget, widgetRegistry, type WidgetType } from "@/cms/widgets";
import {
  sectionContent,
  sectionDefaults,
  type EditableSectionType,
} from "@/cms/section-defaults";
import {
  addSection,
  addSavedSectionToPage,
  applyPageTemplate,
  copySectionToPage,
  deleteSection,
  duplicateSection,
  publishHero,
  publishSection,
  reorderSections,
  saveHeroDraft,
  saveSectionDraft,
  saveSectionAsTemplate,
  setSectionState,
} from "./actions";

type Section = {
  id: string;
  name: string;
  type: string;
  draftContent: unknown;
  visible: boolean;
  locked: boolean;
};
type Tab = "content" | "style" | "advanced" | "responsive";
type MediaAsset = { id: string; title: string; mimeType: string };

export default function EditorClient({
  page,
  sections,
  initialHero,
  previewUrl,
  templates,
  pageTemplates,
  media,
}: {
  page: { id: string; title: string; slug: string; status: string };
  sections: Section[];
  initialHero: HeroContent;
  previewUrl: string;
  templates: { id: string; title: string }[];
  pageTemplates: { id: string; title: string }[];
  media: MediaAsset[];
}) {
  const hero = sections.find((item) => item.type === "hero");
  const [sectionList, setSectionList] = useState(sections);
  const [dragged, setDragged] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selected, setSelected] = useState(hero?.id ?? sections[0]?.id);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [content, setContent] = useState(initialHero);
  const [tab, setTab] = useState<Tab>("content");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [pending, startTransition] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);
  const selectedSection = sectionList.find((item) => item.id === selected);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.source !== "designik-builder"
      )
        return;
      if (sectionList.some((section) => section.id === event.data.sectionId)) {
        setSelected(event.data.sectionId);
        setSelectedElement(event.data.elementId || null);
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [sectionList]);
  const update = <K extends keyof HeroContent>(
    key: K,
    value: HeroContent[K],
  ) => {
    setContent((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setMessage("");
  };
  const refresh = () => frame.current?.contentWindow?.location.reload();
  const save = () =>
    hero &&
    startTransition(async () => {
      await saveHeroDraft(hero.id, content);
      setDirty(false);
      setMessage("Draft saved");
      refresh();
    });
  const publish = () =>
    hero &&
    startTransition(async () => {
      await saveHeroDraft(hero.id, content);
      await publishHero(hero.id);
      setDirty(false);
      setMessage("Published live");
      refresh();
    });
  const dropOn = (target: string) => {
    if (!dragged || dragged === target) return;
    const next = [...sectionList];
    const from = next.findIndex((s) => s.id === dragged),
      to = next.findIndex((s) => s.id === target);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSectionList(next);
    setDragged(null);
    startTransition(async () => {
      await reorderSections(
        page.id,
        next.map((s) => s.id),
      );
      setMessage("Section order saved");
      refresh();
    });
  };
  const add = (type: string) =>
    startTransition(async () => {
      await addSection(page.id, type);
      window.location.reload();
    });
  const duplicate = (id: string) =>
    startTransition(async () => {
      await duplicateSection(id);
      window.location.reload();
    });
  const remove = (id: string) =>
    startTransition(async () => {
      await deleteSection(id);
      window.location.reload();
    });
  const paste = () =>
    copiedSection &&
    startTransition(async () => {
      await copySectionToPage(copiedSection, page.id);
      window.location.reload();
    });
  const saveTemplate = (id: string) =>
    startTransition(async () => {
      await saveSectionAsTemplate(id);
      setMessage("Section saved as template");
    });
  const addTemplate = (id: string) =>
    startTransition(async () => {
      await addSavedSectionToPage(id, page.id);
      window.location.reload();
    });
  const applyTemplate = (id: string) =>
    startTransition(async () => {
      await applyPageTemplate(id, page.id);
      window.location.reload();
    });
  const toggleState = (id: string, field: "visible" | "locked") => {
    const section = sectionList.find((item) => item.id === id);
    if (!section) return;
    const value = !section[field];
    setSectionList((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    startTransition(async () => {
      await setSectionState(id, field, value);
      refresh();
    });
  };

  return (
    <div className="builder-grid grid min-h-[calc(100vh-4rem)] grid-cols-[260px_minmax(500px,1fr)_350px]">
      <aside className="overflow-y-auto border-r border-white/10 bg-[#17181d] p-4">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">
          Navigator
        </h2>
        <div className="mb-3 rounded-lg bg-pink-500/15 px-3 py-2 text-sm font-medium">
          Page · {page.title}
        </div>
        <div className="space-y-1">
          {sectionList.map((section) => (
            <div
              key={section.id}
              draggable={!section.locked}
              onDragStart={() => setDragged(section.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(section.id)}
              className={`group flex items-center rounded-lg ${selected === section.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"}`}
            >
              <button
                onClick={() => setSelected(section.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
              >
                <span className="cursor-grab text-white/30">⠿</span>
                <span className="truncate">{section.name}</span>
              </button>
              <button
                title="Duplicate"
                onClick={() => duplicate(section.id)}
                className="hidden px-1 text-white/40 group-hover:block"
              >
                ⧉
              </button>
              <button
                title={section.visible ? "Hide" : "Show"}
                onClick={() => toggleState(section.id, "visible")}
                className="hidden px-1 text-white/40 group-hover:block"
              >
                {section.visible ? "◉" : "○"}
              </button>
              <button
                title={section.locked ? "Unlock" : "Lock"}
                onClick={() => toggleState(section.id, "locked")}
                className="hidden px-1 text-white/40 group-hover:block"
              >
                {section.locked ? "🔒" : "◇"}
              </button>
              {!["header", "footer"].includes(section.type) && (
                <button
                  title="Delete"
                  onClick={() => remove(section.id)}
                  className="hidden px-2 text-red-400 group-hover:block"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <select
          aria-label="Add section"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) add(e.target.value);
          }}
          className="mt-4 w-full rounded-lg border border-dashed border-white/20 bg-[#17181d] p-3 text-sm text-white/60"
        >
          <option value="" disabled>
            + Add section
          </option>
          {[
            "about",
            "services",
            "stats",
            "brand-heights",
            "experience",
            "portfolio",
            "team",
            "interactive",
            "testimonials",
            "agency-marquee",
            "widgets",
          ].map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("-", " ")}
            </option>
          ))}
        </select>
        <div className="mt-2 grid grid-cols-3 gap-1">
          <button
            type="button"
            disabled={!selectedSection}
            onClick={() =>
              selectedSection && setCopiedSection(selectedSection.id)
            }
            className="rounded border border-white/10 p-2 text-xs text-white/60 disabled:opacity-30"
          >
            Copy
          </button>
          <button
            type="button"
            disabled={!copiedSection || pending}
            onClick={paste}
            className="rounded border border-white/10 p-2 text-xs text-white/60 disabled:opacity-30"
          >
            Paste
          </button>
          <button
            type="button"
            disabled={!selectedSection || pending}
            onClick={() => selectedSection && saveTemplate(selectedSection.id)}
            className="rounded border border-white/10 p-2 text-xs text-white/60 disabled:opacity-30"
          >
            Template
          </button>
        </div>
        <select
          aria-label="Insert saved section"
          defaultValue=""
          onChange={(event) =>
            event.target.value && addTemplate(event.target.value)
          }
          className="mt-2 w-full rounded-lg border border-white/10 bg-[#17181d] p-2 text-xs text-white/60"
        >
          <option value="" disabled>
            Insert saved section
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Apply page template"
          defaultValue=""
          onChange={(event) =>
            event.target.value && applyTemplate(event.target.value)
          }
          className="mt-2 w-full rounded-lg border border-white/10 bg-[#17181d] p-2 text-xs text-white/60"
        >
          <option value="" disabled>
            Apply page template
          </option>
          {pageTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </aside>
      <section className="overflow-hidden bg-[#25262c] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2 rounded-lg bg-black/30 p-1 text-xs">
            {(["desktop", "tablet", "mobile"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setDevice(item)}
                className={`rounded px-3 py-1.5 capitalize ${device === item ? "bg-white/10 text-white" : "text-white/55"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/40">
            Real page · draft preview · {device}
          </span>
        </div>
        <div className="flex h-[calc(100vh-9rem)] justify-center overflow-auto">
          <div
            className="h-full overflow-hidden rounded-xl bg-white shadow-2xl transition-[width] duration-300"
            style={{
              width:
                device === "desktop" ? "100%" : device === "tablet" ? 768 : 390,
            }}
          >
            <iframe
              ref={frame}
              title="Draft website preview"
              src={previewUrl}
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </section>
      <aside className="flex max-h-[calc(100vh-4rem)] flex-col border-l border-white/10 bg-[#17181d]">
        <div className="p-5 pb-0">
          <h2 className="text-lg font-semibold">
            {selectedSection?.name ?? "Settings"}
          </h2>
          <div className="mt-5 flex gap-3 overflow-x-auto border-b border-white/10 text-[11px] text-white/50">
            {(["content", "style", "advanced", "responsive"] as Tab[]).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`whitespace-nowrap border-b-2 pb-3 capitalize ${tab === item ? "border-pink-400 text-white" : "border-transparent"}`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {selectedSection?.locked ? (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
              This section is locked. Unlock it in the Navigator to edit or move
              it.
            </p>
          ) : selectedSection?.type === "hero" ? (
            <HeroPanel
              tab={tab}
              value={content}
              update={update}
              media={media}
            />
          ) : selectedSection && selectedSection.type in sectionDefaults ? (
            <SectionPanel
              key={selectedSection.id}
              section={selectedSection}
              refresh={refresh}
              tab={tab}
              media={media}
              selectedElement={selectedElement}
            />
          ) : (
            <p className="text-sm leading-6 text-white/45">
              This section schema is being converted.
            </p>
          )}
        </div>
        {selectedSection?.type === "hero" && (
          <div className="border-t border-white/10 bg-[#121318] p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={pending || !dirty}
                onClick={save}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
              >
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button
                disabled={pending}
                onClick={publish}
                className="admin-button disabled:opacity-40"
              >
                Publish
              </button>
            </div>
            <p
              className={`mt-2 min-h-4 text-center text-xs ${dirty ? "text-amber-300" : "text-emerald-300"}`}
            >
              {dirty ? "Unsaved changes" : message}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function SectionPanel({
  section,
  refresh,
  tab,
  media,
  selectedElement,
}: {
  section: Section;
  refresh: () => void;
  tab: Tab;
  media: MediaAsset[];
  selectedElement: string | null;
}) {
  const type = section.type as EditableSectionType;
  const [value, setValue] = useState<Record<string, unknown>>(
    () =>
      sectionContent(type, section.draftContent) as unknown as Record<
        string,
        unknown
      >,
  );
  const [status, setStatus] = useState("");
  const [past, setPast] = useState<Record<string, unknown>[]>([]);
  const [future, setFuture] = useState<Record<string, unknown>[]>([]);
  const [pending, start] = useTransition();
  const change = (key: string, next: unknown) => {
    setPast((items) => [...items, value]);
    setFuture([]);
    setValue((old) => ({ ...old, [key]: next }));
  };
  const undo = () => {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((items) => [value, ...items]);
    setValue(previous);
    setPast((items) => items.slice(0, -1));
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, value]);
    setValue(next);
    setFuture((items) => items.slice(1));
  };
  const save = () =>
    start(async () => {
      await saveSectionDraft(section.id, type, value);
      setStatus("Draft saved");
      refresh();
    });
  const publish = () =>
    start(async () => {
      await saveSectionDraft(section.id, type, value);
      await publishSection(section.id, type);
      setStatus("Published live");
      refresh();
    });
  const layout = (value._layout || {}) as Record<string, unknown>;
  const changeLayout = (key: string, next: unknown) =>
    change("_layout", { ...layout, [key]: next });
  const layoutNumber = (key: string, label: string) => (
    <NumberField
      label={label}
      value={Number(layout[key] || 0)}
      onChange={(next) => changeLayout(key, next)}
    />
  );
  const layoutToggle = (key: string, label: string) => (
    <Toggle
      label={label}
      checked={layout[key] !== false}
      onChange={(next) => changeLayout(key, next)}
    />
  );
  const panel =
    tab === "style" ? (
      <div className="space-y-4">
        <Color
          label="Section background"
          value={String(layout.backgroundColor || "transparent")}
          onChange={(next) => changeLayout("backgroundColor", next)}
        />
        {layoutNumber("paddingTop", "Padding top")}
        {layoutNumber("paddingBottom", "Padding bottom")}
        {layoutNumber("marginTop", "Margin top")}
        {layoutNumber("marginBottom", "Margin bottom")}
        {layoutNumber("maxWidth", "Maximum width (0 = full)")}
        <Select
          label="Alignment"
          value={String(layout.alignment || "left")}
          options={["left", "center", "right"]}
          onChange={(next) => changeLayout("alignment", next)}
        />
      </div>
    ) : tab === "responsive" ? (
      <div className="space-y-4">
        {layoutToggle("desktopVisible", "Show on desktop")}
        {layoutToggle("tabletVisible", "Show on tablet")}
        {layoutToggle("mobileVisible", "Show on mobile")}
      </div>
    ) : tab === "advanced" ? (
      <div className="space-y-4">
        <Select
          label="Entrance animation"
          value={String(layout.animation || "none")}
          options={["none", "fade", "slide-up", "zoom"]}
          onChange={(next) => changeLayout("animation", next)}
        />
        <NumberField
          label="Animation duration"
          value={Number(layout.animationDuration || 0.6)}
          min={0}
          max={5}
          step={0.1}
          onChange={(next) => changeLayout("animationDuration", next)}
        />
      </div>
    ) : null;
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          disabled={!past.length}
          onClick={undo}
          className="rounded border border-white/10 px-2 py-1 text-xs disabled:opacity-30"
        >
          ↶ Undo
        </button>
        <button
          disabled={!future.length}
          onClick={redo}
          className="rounded border border-white/10 px-2 py-1 text-xs disabled:opacity-30"
        >
          Redo ↷
        </button>
      </div>
      {panel ||
        Object.entries(value)
          .filter(([key]) => key !== "_layout")
          .map(([key, current]) => (
            <div key={key} className="block text-xs capitalize text-white/55">
              <span>{key.replace(/([A-Z])/g, " $1")}</span>
              {key === "widgets" && Array.isArray(current) ? (
                <WidgetList
                  value={current as BuilderWidget[]}
                  onChange={(next) => change(key, next)}
                  media={media}
                  selectedElement={selectedElement}
                />
              ) : Array.isArray(current) || typeof current === "object" ? (
                <StructuredField
                  name={key}
                  value={current}
                  onChange={(next) => change(key, next)}
                  media={media}
                />
              ) : typeof current === "boolean" ? (
                <input
                  className="ml-3"
                  type="checkbox"
                  checked={current}
                  onChange={(e) => change(key, e.target.checked)}
                />
              ) : (
                <input
                  className="admin-input mt-2"
                  type={typeof current === "number" ? "number" : "text"}
                  value={String(current ?? "")}
                  onChange={(e) =>
                    change(
                      key,
                      typeof current === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              )}
            </div>
          ))}
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={pending}
          onClick={save}
          className="rounded-lg border border-white/15 px-3 py-2 text-sm"
        >
          Save draft
        </button>
        <button disabled={pending} onClick={publish} className="admin-button">
          Publish
        </button>
      </div>
      <p className="text-center text-xs text-emerald-300">{status}</p>
    </div>
  );
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function StructuredField({
  name,
  value,
  onChange,
  depth = 0,
  media,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
  media: MediaAsset[];
}) {
  if (Array.isArray(value)) {
    const move = (index: number, delta: number) => {
      const target = index + delta;
      if (target < 0 || target >= value.length) return;
      const next = [...value];
      [next[index], next[target]] = [next[target], next[index]];
      onChange(next);
    };
    return (
      <div className="mt-2 space-y-2 rounded-lg border border-white/10 p-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg bg-white/[.035] p-2">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase text-white/40">
              <span className="mr-auto">
                {name.replace(/([A-Z])/g, " $1")} {index + 1}
              </span>
              <button
                type="button"
                aria-label="Move up"
                disabled={!index}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Duplicate"
                onClick={() =>
                  onChange([
                    ...value.slice(0, index + 1),
                    cloneValue(item),
                    ...value.slice(index + 1),
                  ])
                }
              >
                ⧉
              </button>
              <button
                type="button"
                aria-label="Remove"
                className="text-red-400"
                onClick={() =>
                  onChange(value.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                ×
              </button>
            </div>
            <StructuredField
              name={`${name}-${index}`}
              value={item}
              onChange={(nextItem) =>
                onChange(
                  value.map((entry, itemIndex) =>
                    itemIndex === index ? nextItem : entry,
                  ),
                )
              }
              depth={depth + 1}
              media={media}
            />
          </div>
        ))}
        <button
          type="button"
          className="w-full rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs text-white/60"
          onClick={() =>
            onChange([
              ...value,
              value.length ? cloneValue(value.at(-1)) : "New item",
            ])
          }
        >
          + Add item
        </button>
      </div>
    );
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      <div
        className={`mt-2 space-y-2 rounded-lg border border-white/10 ${depth ? "p-2" : "p-3"}`}
      >
        {Object.entries(record).map(([key, child]) => (
          <div key={key}>
            <span className="text-[10px] capitalize text-white/45">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <StructuredField
              name={key}
              value={child}
              onChange={(nextChild) =>
                onChange({ ...record, [key]: nextChild })
              }
              depth={depth + 1}
              media={media}
            />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="mt-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{value ? "Enabled" : "Disabled"}</span>
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <input
        className="admin-input mt-1"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    );
  }
  const stringValue = String(value ?? "");
  const colorField =
    /color|background$/i.test(name) &&
    /^#|rgb|hsl|transparent/i.test(stringValue);
  const multiline = stringValue.includes("\n") || stringValue.length > 90;
  const mediaField = /image|video|photo|avatar|logo|background/i.test(name);
  if (mediaField)
    return (
      <MediaPicker
        label=""
        value={stringValue}
        media={media}
        accept={/video/i.test(name) ? "video" : "image"}
        onChange={onChange}
      />
    );
  if (colorField)
    return (
      <div className="mt-1 flex gap-2">
        <input
          type="color"
          value={stringValue.startsWith("#") ? stringValue : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-11 rounded border border-white/10 bg-transparent"
        />
        <input
          className="admin-input"
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  if (multiline)
    return (
      <textarea
        className="admin-input mt-1 min-h-20"
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  return (
    <input
      className="admin-input mt-1"
      type={/link|href/i.test(name) ? "url" : "text"}
      value={stringValue}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

type BuilderWidget = {
  id: string;
  type: string;
  content: string;
  settings: Record<string, string | number | boolean>;
};
function WidgetList({
  value,
  onChange,
  media,
  selectedElement,
}: {
  value: BuilderWidget[];
  onChange: (value: BuilderWidget[]) => void;
  media: MediaAsset[];
  selectedElement: string | null;
}) {
  const [widgetSearch, setWidgetSearch] = useState("");
  const add = (type: string) => {
    if (!type) return;
    onChange([...value, newWidget(type as WidgetType, crypto.randomUUID())]);
  };
  const update = (index: number, patch: Partial<BuilderWidget>) =>
    onChange(
      value.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  const setting = (
    index: number,
    key: string,
    next: string | number | boolean,
  ) => update(index, { settings: { ...value[index].settings, [key]: next } });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="mt-2 space-y-3">
      <input
        className="admin-input"
        placeholder="Search widgets…"
        value={widgetSearch}
        onChange={(e) => setWidgetSearch(e.target.value)}
      />
      <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
        {widgetRegistry
          .filter(([type, label, category]) =>
            `${type} ${label} ${category}`
              .toLowerCase()
              .includes(widgetSearch.toLowerCase()),
          )
          .map(([type, label, category]) => (
            <button
              key={type}
              onClick={() => add(type)}
              className="rounded-lg border border-white/10 bg-white/[.03] p-2 text-left hover:border-pink-400/50"
            >
              <span className="block text-xs text-white/80">{label}</span>
              <span className="text-[9px] uppercase text-white/35">
                {category}
              </span>
            </button>
          ))}
      </div>
      {value.map((widget, index) => (
        <div
          key={widget.id}
          className={`rounded-lg border bg-white/[.03] p-3 ${selectedElement === widget.id ? "border-pink-400 ring-1 ring-pink-400/30" : "border-white/10"}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <b className="mr-auto text-xs uppercase text-white/70">
              {widget.type}
            </b>
            <button onClick={() => move(index, -1)} disabled={!index}>
              ↑
            </button>
            <button
              onClick={() => move(index, 1)}
              disabled={index === value.length - 1}
            >
              ↓
            </button>
            <button
              className="text-red-400"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              ×
            </button>
          </div>
          <textarea
            className="admin-input min-h-16"
            value={widget.content}
            onChange={(e) => update(index, { content: e.target.value })}
          />
          {["image", "video", "audio"].includes(widget.type) && (
            <select
              value=""
              onChange={(e) =>
                e.target.value && update(index, { content: e.target.value })
              }
              className="admin-input mt-2 text-xs"
            >
              <option value="">Choose from Media Library…</option>
              {media
                .filter((asset) => asset.mimeType.startsWith(`${widget.type}/`))
                .map((asset) => (
                  <option key={asset.id} value={`/api/media/${asset.id}`}>
                    {asset.title}
                  </option>
                ))}
            </select>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              className="admin-input"
              value={String(widget.settings.color || "")}
              aria-label="Widget color"
              onChange={(e) =>
                update(index, {
                  settings: { ...widget.settings, color: e.target.value },
                })
              }
            />
            <input
              className="admin-input"
              type="number"
              value={Number(widget.settings.fontSize || 16)}
              aria-label="Widget font size"
              onChange={(e) =>
                update(index, {
                  settings: {
                    ...widget.settings,
                    fontSize: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <details
            open={selectedElement === widget.id}
            className="mt-2 rounded border border-white/10 p-2"
          >
            <summary className="cursor-pointer text-[10px] font-semibold uppercase text-white/50">
              Advanced widget controls
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                aria-label="Widget background color"
                className="admin-input"
                value={String(widget.settings.backgroundColor || "transparent")}
                onChange={(e) =>
                  setting(index, "backgroundColor", e.target.value)
                }
              />
              <input
                aria-label="Widget font weight"
                type="number"
                className="admin-input"
                value={Number(widget.settings.fontWeight || 400)}
                onChange={(e) =>
                  setting(index, "fontWeight", Number(e.target.value))
                }
              />
              {[
                ["width", "Width %"],
                ["height", "Height"],
                ["marginTop", "Margin top"],
                ["marginBottom", "Margin bottom"],
                ["padding", "Padding"],
                ["borderWidth", "Border width"],
                ["borderRadius", "Border radius"],
                ["gap", "Gap"],
                ["columns", "Columns"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  aria-label={`Widget ${label}`}
                  title={label}
                  type="number"
                  className="admin-input"
                  value={Number(widget.settings[key] || 0)}
                  onChange={(e) => setting(index, key, Number(e.target.value))}
                />
              ))}
              <input
                aria-label="Widget border color"
                className="admin-input"
                value={String(widget.settings.borderColor || "transparent")}
                onChange={(e) => setting(index, "borderColor", e.target.value)}
              />
              <input
                aria-label="Widget shadow"
                className="admin-input"
                value={String(widget.settings.shadow || "none")}
                onChange={(e) => setting(index, "shadow", e.target.value)}
              />
              <input
                aria-label="Widget hover color"
                className="admin-input"
                value={String(widget.settings.hoverColor || "")}
                onChange={(e) => setting(index, "hoverColor", e.target.value)}
              />
              <input
                aria-label="Widget hover background"
                className="admin-input"
                value={String(
                  widget.settings.hoverBackgroundColor || "transparent",
                )}
                onChange={(e) =>
                  setting(index, "hoverBackgroundColor", e.target.value)
                }
              />
              <input
                aria-label="Widget link"
                className="admin-input"
                value={String(widget.settings.href || "#")}
                onChange={(e) => setting(index, "href", e.target.value)}
              />
              <input
                aria-label="Widget alternative text"
                className="admin-input"
                value={String(widget.settings.alt || "")}
                onChange={(e) => setting(index, "alt", e.target.value)}
              />
              <select
                aria-label="Widget alignment"
                className="admin-input"
                value={String(widget.settings.align || "center")}
                onChange={(e) => setting(index, "align", e.target.value)}
              >
                <option>left</option>
                <option>center</option>
                <option>right</option>
              </select>
              <select
                aria-label="Widget animation"
                className="admin-input"
                value={String(widget.settings.animation || "none")}
                onChange={(e) => setting(index, "animation", e.target.value)}
              >
                <option>none</option>
                <option>fade</option>
                <option>slide-up</option>
                <option>zoom</option>
              </select>
            </div>
            <div className="mt-3 space-y-2">
              {[
                ["desktopVisible", "Desktop visible"],
                ["tabletVisible", "Tablet visible"],
                ["mobileVisible", "Mobile visible"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between text-xs text-white/55"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={widget.settings[key] !== false}
                    onChange={(e) => setting(index, key, e.target.checked)}
                  />
                </label>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}

function HeroPanel({
  tab,
  value,
  update,
  media,
}: {
  tab: Tab;
  value: HeroContent;
  update: <K extends keyof HeroContent>(key: K, value: HeroContent[K]) => void;
  media: MediaAsset[];
}) {
  if (tab === "content")
    return (
      <div className="space-y-5">
        <Group title="Text">
          <Text
            label="Heading"
            value={value.heading}
            onChange={(v) => update("heading", v)}
          />
          <Area
            label="Description"
            value={value.description}
            onChange={(v) => update("description", v)}
          />
        </Group>
        <Group title="Primary button">
          <Text
            label="Label"
            value={value.primaryLabel}
            onChange={(v) => update("primaryLabel", v)}
          />
          <Text
            label="Link"
            value={value.primaryLink}
            onChange={(v) => update("primaryLink", v)}
          />
          <Select
            label="Icon"
            value={value.primaryIcon}
            options={["arrow", "none"]}
            onChange={(v) =>
              update("primaryIcon", v as HeroContent["primaryIcon"])
            }
          />
        </Group>
        <Group title="Secondary button">
          <Text
            label="Label"
            value={value.secondaryLabel}
            onChange={(v) => update("secondaryLabel", v)}
          />
          <Text
            label="Link"
            value={value.secondaryLink}
            onChange={(v) => update("secondaryLink", v)}
          />
          <Select
            label="Icon"
            value={value.secondaryIcon}
            options={["play", "none"]}
            onChange={(v) =>
              update("secondaryIcon", v as HeroContent["secondaryIcon"])
            }
          />
        </Group>
        <Group title="Media">
          <MediaPicker
            label="Background image URL"
            value={value.backgroundImage}
            media={media}
            accept="image"
            onChange={(v) => update("backgroundImage", v)}
          />
          <MediaPicker
            label="TV video URL"
            value={value.video}
            media={media}
            accept="video"
            onChange={(v) => update("video", v)}
          />
          <Select
            label="Video fit"
            value={value.videoFit}
            options={["cover", "contain", "fill"]}
            onChange={(v) => update("videoFit", v as HeroContent["videoFit"])}
          />
        </Group>
      </div>
    );
  if (tab === "style")
    return (
      <div className="space-y-5">
        <Group title="Background">
          <Color
            label="Fallback color"
            value={value.backgroundColor}
            onChange={(v) => update("backgroundColor", v)}
          />
          <Color
            label="Top overlay"
            value={value.overlayColor}
            onChange={(v) => update("overlayColor", v)}
          />
          <NumberField
            label="Overlay opacity %"
            value={value.overlayOpacity}
            min={0}
            max={100}
            onChange={(v) => update("overlayOpacity", v)}
          />
          <NumberField
            label="Scene scale"
            value={value.sceneScale}
            min={0.8}
            max={1.5}
            step={0.01}
            onChange={(v) => update("sceneScale", v)}
          />
        </Group>
        <Group title="Heading">
          <Text
            label="Font family / CSS variable"
            value={value.headingFont}
            onChange={(v) => update("headingFont", v)}
          />
          <Color
            label="Color"
            value={value.headingColor}
            onChange={(v) => update("headingColor", v)}
          />
          <NumberField
            label="Weight"
            value={value.headingWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => update("headingWeight", v)}
          />
          <NumberField
            label="Letter spacing (em)"
            value={value.headingLetterSpacing}
            min={-0.2}
            max={1}
            step={0.01}
            onChange={(v) => update("headingLetterSpacing", v)}
          />
        </Group>
        <Group title="Description">
          <Text
            label="Font family / CSS variable"
            value={value.descriptionFont}
            onChange={(v) => update("descriptionFont", v)}
          />
          <Color
            label="Color"
            value={value.descriptionColor}
            onChange={(v) => update("descriptionColor", v)}
          />
          <NumberField
            label="Weight"
            value={value.descriptionWeight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => update("descriptionWeight", v)}
          />
        </Group>
        <Group title="Primary button">
          <Color
            label="Background"
            value={value.primaryBackground}
            onChange={(v) => update("primaryBackground", v)}
          />
          <Color
            label="Text"
            value={value.primaryColor}
            onChange={(v) => update("primaryColor", v)}
          />
          <Color
            label="Border"
            value={value.primaryBorderColor}
            onChange={(v) => update("primaryBorderColor", v)}
          />
          <NumberField
            label="Border width"
            value={value.primaryBorderWidth}
            min={0}
            max={10}
            onChange={(v) => update("primaryBorderWidth", v)}
          />
        </Group>
        <Group title="Secondary button">
          <Color
            label="Background"
            value={value.secondaryBackground}
            onChange={(v) => update("secondaryBackground", v)}
          />
          <Color
            label="Text"
            value={value.secondaryColor}
            onChange={(v) => update("secondaryColor", v)}
          />
          <Color
            label="Border"
            value={value.secondaryBorderColor}
            onChange={(v) => update("secondaryBorderColor", v)}
          />
          <NumberField
            label="Border width"
            value={value.secondaryBorderWidth}
            min={0}
            max={10}
            onChange={(v) => update("secondaryBorderWidth", v)}
          />
        </Group>
      </div>
    );
  if (tab === "advanced")
    return (
      <div className="space-y-5">
        <Group title="Layout">
          <Select
            label="Alignment"
            value={value.alignment}
            options={["left", "center", "right"]}
            onChange={(v) => update("alignment", v as HeroContent["alignment"])}
          />
          <NumberField
            label="Content max width (px)"
            value={value.contentMaxWidth}
            min={320}
            max={1800}
            onChange={(v) => update("contentMaxWidth", v)}
          />
          <NumberField
            label="Heading/description gap"
            value={value.textGap}
            min={0}
            max={100}
            onChange={(v) => update("textGap", v)}
          />
          <NumberField
            label="Buttons top spacing"
            value={value.buttonsTop}
            min={0}
            max={150}
            onChange={(v) => update("buttonsTop", v)}
          />
          <NumberField
            label="Button gap"
            value={value.buttonGap}
            min={0}
            max={100}
            onChange={(v) => update("buttonGap", v)}
          />
        </Group>
        <Group title="Button geometry">
          <NumberField
            label="Font size"
            value={value.buttonFontSize}
            min={8}
            max={40}
            onChange={(v) => update("buttonFontSize", v)}
          />
          <NumberField
            label="Horizontal padding"
            value={value.buttonPaddingX}
            min={0}
            max={80}
            onChange={(v) => update("buttonPaddingX", v)}
          />
          <NumberField
            label="Vertical padding"
            value={value.buttonPaddingY}
            min={0}
            max={50}
            onChange={(v) => update("buttonPaddingY", v)}
          />
          <NumberField
            label="Border radius"
            value={value.buttonRadius}
            min={0}
            max={999}
            onChange={(v) => update("buttonRadius", v)}
          />
        </Group>
        <Group title="Hover states">
          <Color
            label="Primary background"
            value={value.primaryHoverBackground}
            onChange={(v) => update("primaryHoverBackground", v)}
          />
          <Color
            label="Primary text"
            value={value.primaryHoverColor}
            onChange={(v) => update("primaryHoverColor", v)}
          />
          <Color
            label="Secondary background"
            value={value.secondaryHoverBackground}
            onChange={(v) => update("secondaryHoverBackground", v)}
          />
          <Color
            label="Secondary text"
            value={value.secondaryHoverColor}
            onChange={(v) => update("secondaryHoverColor", v)}
          />
          <NumberField
            label="Scale"
            value={value.hoverScale}
            min={0.8}
            max={1.3}
            step={0.01}
            onChange={(v) => update("hoverScale", v)}
          />
        </Group>
        <Group title="Animation">
          <Select
            label="Entrance"
            value={value.entranceAnimation}
            options={["fade-up", "fade", "zoom", "none"]}
            onChange={(v) =>
              update("entranceAnimation", v as HeroContent["entranceAnimation"])
            }
          />
          <NumberField
            label="Duration (seconds)"
            value={value.animationDuration}
            min={0}
            max={5}
            step={0.05}
            onChange={(v) => update("animationDuration", v)}
          />
          <NumberField
            label="Delay (seconds)"
            value={value.animationDelay}
            min={0}
            max={5}
            step={0.05}
            onChange={(v) => update("animationDelay", v)}
          />
          <Toggle
            label="Show scroll cue"
            checked={value.showScrollCue}
            onChange={(v) => update("showScrollCue", v)}
          />
        </Group>
      </div>
    );
  return (
    <div className="space-y-5">
      <Group title="Desktop">
        <NumberField
          label="Heading size (px)"
          value={value.headingSizeDesktop}
          min={10}
          max={200}
          onChange={(v) => update("headingSizeDesktop", v)}
        />
        <NumberField
          label="Description size (px)"
          value={value.descriptionSizeDesktop}
          min={8}
          max={80}
          onChange={(v) => update("descriptionSizeDesktop", v)}
        />
        <NumberField
          label="Content top (vh)"
          value={value.contentTopDesktop}
          min={0}
          max={80}
          onChange={(v) => update("contentTopDesktop", v)}
        />
      </Group>
      <Group title="Tablet">
        <NumberField
          label="Heading size (px)"
          value={value.headingSizeTablet}
          min={10}
          max={200}
          onChange={(v) => update("headingSizeTablet", v)}
        />
        <NumberField
          label="Description size (px)"
          value={value.descriptionSizeTablet}
          min={8}
          max={80}
          onChange={(v) => update("descriptionSizeTablet", v)}
        />
        <NumberField
          label="Content top (vh)"
          value={value.contentTopTablet}
          min={0}
          max={80}
          onChange={(v) => update("contentTopTablet", v)}
        />
      </Group>
      <Group title="Mobile">
        <NumberField
          label="Heading size (px)"
          value={value.headingSizeMobile}
          min={10}
          max={120}
          onChange={(v) => update("headingSizeMobile", v)}
        />
        <NumberField
          label="Description size (px)"
          value={value.descriptionSizeMobile}
          min={8}
          max={60}
          onChange={(v) => update("descriptionSizeMobile", v)}
        />
        <NumberField
          label="Content top (vh)"
          value={value.contentTopMobile}
          min={0}
          max={80}
          onChange={(v) => update("contentTopMobile", v)}
        />
      </Group>
    </div>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details open className="rounded-lg border border-white/10 bg-white/[.025]">
      <summary className="cursor-pointer px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/70">
        {title}
      </summary>
      <div className="space-y-3 border-t border-white/10 p-3">{children}</div>
    </details>
  );
}
const labelClass = "block text-[11px] text-white/50";
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className="admin-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function MediaPicker({
  label,
  value,
  media,
  accept,
  onChange,
}: {
  label: string;
  value: string;
  media: MediaAsset[];
  accept: "image" | "video";
  onChange: (v: string) => void;
}) {
  const compatible = media.filter((asset) =>
    asset.mimeType.startsWith(`${accept}/`),
  );
  return (
    <div className={labelClass}>
      {label && <span>{label}</span>}
      <input
        className="admin-input mt-1.5"
        value={value}
        aria-label={label || `${accept} URL`}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <select
          aria-label={`Choose ${accept} from Media Library`}
          value=""
          onChange={(event) =>
            event.target.value && onChange(event.target.value)
          }
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#222329] px-2 py-2 text-xs text-white/70"
        >
          <option value="">Choose from Media Library…</option>
          {compatible.map((asset) => (
            <option key={asset.id} value={`/api/media/${asset.id}`}>
              {asset.title}
            </option>
          ))}
        </select>
        <a
          href="/admin/media"
          target="_blank"
          className="rounded-md border border-white/10 px-2 py-2 text-xs text-white/60"
        >
          Library
        </a>
      </div>
    </div>
  );
}
function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        className="admin-input mt-1.5 min-h-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        className="admin-input mt-1.5"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        className="admin-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const native = /^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff";
  return (
    <label className={labelClass}>
      {label}
      <span className="mt-1.5 flex gap-2">
        <input
          type="color"
          className="h-10 w-12 rounded border border-white/10 bg-transparent"
          value={native}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="admin-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between text-xs text-white/60">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-pink-500"
      />
    </label>
  );
}
