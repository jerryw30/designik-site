"use client";

import { useRef, useState } from "react";
import { newWidget, widgetRegistry, type WidgetType } from "@/cms/widgets";
import { COLUMN_PRESETS, type LayoutColumn, type LayoutRow, type LayoutWidget, rowDefaults } from "@/cms/layout";

type MediaAsset = { id: string; title: string; mimeType: string };
const mediaUrl = (m: MediaAsset) => `/api/media/${m.id}`;

const uid = (p: string) => `${p}-${(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))}`;

function mkWidget(type: WidgetType): LayoutWidget {
  return newWidget(type, uid("w")) as LayoutWidget;
}
function mkColumn(width: number): LayoutColumn {
  return { id: uid("col"), width, widgets: [] };
}
function mkRow(widths: number[]): LayoutRow {
  return { id: uid("row"), columns: widths.map(mkColumn), settings: { ...rowDefaults } };
}

const inp = "w-full rounded-md border border-white/15 bg-black/30 px-2.5 py-1.5 text-[13px] text-white outline-none placeholder:text-white/30 focus:border-[#ff2e73]";
const lbl = "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40";
const btn = "rounded-md border border-white/15 px-2 py-1 text-[11px] text-white/70 transition hover:border-[#ff2e73] hover:text-white";

/* ------------------------------------------------------------------ */
/* Single widget editor                                                */
/* ------------------------------------------------------------------ */
const IMAGE_TYPES = ["image", "video", "audio", "image-box", "gallery", "carousel"];
const MULTILINE: Record<string, string> = {
  text: "Paragraph text",
  html: "HTML / code",
  "social-icons": "Label|URL — one per line",
  accordion: "Question|Answer — one per line",
  tabs: "Tab title|Tab content — one per line",
  "icon-list": "One item per line",
  gallery: "One image URL per line",
  carousel: "One image URL per line",
};

function WidgetCard({
  widget,
  media,
  onChange,
  onDelete,
  onMove,
  moveTargets,
  onMoveToColumn,
}: {
  widget: LayoutWidget;
  media: MediaAsset[];
  onChange: (w: LayoutWidget) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  moveTargets: { label: string; index: number }[];
  onMoveToColumn: (colIndex: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<LayoutWidget>) => onChange({ ...widget, ...patch });
  const setS = (k: string, v: string | number | boolean) => onChange({ ...widget, settings: { ...widget.settings, [k]: v } });
  const label = widgetRegistry.find((w) => w[0] === widget.type)?.[1] || widget.type;
  const isImage = IMAGE_TYPES.includes(widget.type);
  const contentLabel = MULTILINE[widget.type] || "Content";
  const multiline = widget.type in MULTILINE;

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/media/upload", { method: "POST", headers: { Accept: "application/json" }, body: fd });
      const data = await res.json();
      const url = data.assets?.[0]?.url;
      if (res.ok && url) set({ content: multiline ? `${widget.content}\n${url}`.trim() : url });
    } catch {
      /* leave content unchanged */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="flex-1 truncate text-[12px] font-medium text-white/85">{label}</span>
        <button type="button" onClick={() => onMove(-1)} className={btn} title="Move up">↑</button>
        <button type="button" onClick={() => onMove(1)} className={btn} title="Move down">↓</button>
        <button type="button" onClick={() => setOpen((v) => !v)} className={btn}>{open ? "Done" : "Edit"}</button>
        <button type="button" onClick={onDelete} className="rounded-md border border-red-400/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10">✕</button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2.5">
          <div>
            <span className={lbl}>{contentLabel}</span>
            {multiline ? (
              <textarea rows={3} value={widget.content} onChange={(e) => set({ content: e.target.value })} className={`${inp} font-mono`} />
            ) : (
              <input value={widget.content} onChange={(e) => set({ content: e.target.value })} className={inp} />
            )}
          </div>

          {isImage && (
            <div>
              <span className={lbl}>Pick from media</span>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    set({ content: multiline ? `${widget.content}\n${e.target.value}`.trim() : e.target.value });
                  }}
                  className={inp}
                >
                  <option value="">Choose an image…</option>
                  {media.filter((m) => m.mimeType.startsWith("image/")).map((m) => (
                    <option key={m.id} value={mediaUrl(m)}>{m.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 rounded-md border border-white/15 bg-[#a10140]/80 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#a10140] disabled:opacity-50"
                >
                  {uploading ? "…" : "Upload"}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                }}
              />
            </div>
          )}

          {widget.type === "image" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={lbl}>Image fit</span>
                <select value={String(widget.settings.fit || "contain")} onChange={(e) => setS("fit", e.target.value)} className={inp}>
                  <option value="contain">Contain (whole image)</option>
                  <option value="cover">Cover (fill, crop edges)</option>
                  <option value="fill">Stretch</option>
                </select>
              </div>
              <div>
                <span className={lbl}>Image position</span>
                <select value={String(widget.settings.position || "center")} onChange={(e) => setS("position", e.target.value)} className={inp}>
                  {["center", "top", "bottom", "left", "right", "left top", "right top", "left bottom", "right bottom"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {widget.type === "button" && (
            <div>
              <span className={lbl}>Link (href)</span>
              <input value={String(widget.settings.href || "#")} onChange={(e) => setS("href", e.target.value)} className={inp} />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className={lbl}>Color</span>
              <input type="color" value={String(widget.settings.color || "#202126")} onChange={(e) => setS("color", e.target.value)} className="h-8 w-full rounded-md border border-white/15 bg-transparent" />
            </div>
            <div>
              <span className={lbl}>Font size</span>
              <input type="number" value={Number(widget.settings.fontSize || 16)} onChange={(e) => setS("fontSize", Number(e.target.value))} className={inp} />
            </div>
            <div>
              <span className={lbl}>Align</span>
              <select value={String(widget.settings.align || "left")} onChange={(e) => setS("align", e.target.value)} className={inp}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          {moveTargets.length > 0 && (
            <div>
              <span className={lbl}>Move to column</span>
              <select value="" onChange={(e) => e.target.value !== "" && onMoveToColumn(Number(e.target.value))} className={inp}>
                <option value="">Same column</option>
                {moveTargets.map((t) => (
                  <option key={t.index} value={t.index}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Widget palette (add)                                                */
/* ------------------------------------------------------------------ */
function AddWidget({ onAdd }: { onAdd: (type: WidgetType) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const groups = [...new Set(widgetRegistry.map((w) => w[2]))];
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full rounded-lg border border-dashed border-white/20 py-2 text-[12px] font-medium text-white/60 transition hover:border-[#ff2e73] hover:text-white">
        + Add widget
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2">
          <input autoFocus placeholder="Search widgets…" value={q} onChange={(e) => setQ(e.target.value)} className={`${inp} mb-2`} />
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {groups.map((g) => {
              const items = widgetRegistry.filter((w) => w[2] === g && (!q || w[1].toLowerCase().includes(q.toLowerCase())));
              if (!items.length) return null;
              return (
                <div key={g}>
                  <p className="px-1 pb-1 text-[9px] font-semibold uppercase tracking-wide text-white/30">{g}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((w) => (
                      <button key={w[0]} type="button" onClick={() => { onAdd(w[0] as WidgetType); setOpen(false); setQ(""); }} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left text-[11px] text-white/75 hover:border-[#ff2e73] hover:text-white">
                        {w[1]}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row editor                                                          */
/* ------------------------------------------------------------------ */
function RowCard({
  row,
  media,
  index,
  total,
  onChange,
  onDelete,
  onMove,
}: {
  row: LayoutRow;
  media: MediaAsset[];
  index: number;
  total: number;
  onChange: (r: LayoutRow) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setCols = (cols: LayoutColumn[]) => onChange({ ...row, columns: cols });
  const setRowSetting = (k: keyof LayoutRow["settings"], v: string | number | boolean) => onChange({ ...row, settings: { ...row.settings, [k]: v } });

  const applyPreset = (widths: number[]) => {
    // keep existing widgets, redistribute into the new column count
    const existing = row.columns.flatMap((c) => c.widgets);
    const cols = widths.map((w, i) => ({ id: uid("col"), width: w, widgets: i === 0 ? existing : [] }));
    onChange({ ...row, columns: cols });
  };

  const colTargets = row.columns.map((_, i) => ({ label: `Column ${i + 1}`, index: i }));

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-white/45">Row {index + 1}</span>
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className={`${btn} disabled:opacity-30`}>↑</button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className={`${btn} disabled:opacity-30`}>↓</button>
        <button type="button" onClick={() => setSettingsOpen((v) => !v)} className={btn}>⚙</button>
        <button type="button" onClick={onDelete} className="rounded-md border border-red-400/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/10">Delete</button>
      </div>

      {/* column layout presets */}
      <div className="mb-2.5">
        <span className={lbl}>Column layout</span>
        <div className="flex flex-wrap gap-1.5">
          {COLUMN_PRESETS.map((p) => {
            const active = row.columns.length === p.widths.length && row.columns.every((c, i) => Math.round(c.width) === Math.round(p.widths[i]));
            return (
              <button key={p.label} type="button" onClick={() => applyPreset(p.widths)} className={`rounded-md border px-2 py-1 text-[11px] ${active ? "border-[#ff2e73] bg-[#ff2e73]/15 text-white" : "border-white/15 text-white/60 hover:border-white/40"}`}>
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {settingsOpen && (
        <div className="mb-2.5 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/30 p-2.5">
          <div><span className={lbl}>Gap</span><input type="number" value={row.settings.gap} onChange={(e) => setRowSetting("gap", Number(e.target.value))} className={inp} /></div>
          <div><span className={lbl}>Vertical align</span>
            <select value={row.settings.verticalAlign} onChange={(e) => setRowSetting("verticalAlign", e.target.value)} className={inp}>
              <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option><option value="stretch">Stretch</option>
            </select>
          </div>
          <div><span className={lbl}>Padding Y</span><input type="number" value={row.settings.paddingY} onChange={(e) => setRowSetting("paddingY", Number(e.target.value))} className={inp} /></div>
          <div><span className={lbl}>Padding X</span><input type="number" value={row.settings.paddingX} onChange={(e) => setRowSetting("paddingX", Number(e.target.value))} className={inp} /></div>
          <div className="col-span-2"><span className={lbl}>Background</span><input value={row.settings.background} onChange={(e) => setRowSetting("background", e.target.value)} placeholder="transparent / #fff / gradient" className={inp} /></div>
        </div>
      )}

      {/* columns */}
      <div className="space-y-2.5">
        {row.columns.map((col, ci) => (
          <div key={col.id} className="rounded-lg border border-white/8 bg-black/20 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Column {ci + 1}</span>
              <span className="text-[10px] text-white/35">width</span>
              <input type="number" value={Math.round(col.width)} onChange={(e) => { const cols = [...row.columns]; cols[ci] = { ...col, width: Number(e.target.value) }; setCols(cols); }} className="w-16 rounded border border-white/15 bg-black/30 px-1.5 py-1 text-[12px] text-white" />
              <span className="text-[10px] text-white/35">%</span>
            </div>
            <div className="space-y-2">
              {col.widgets.map((w, wi) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  media={media}
                  onChange={(nw) => { const cols = [...row.columns]; const ws = [...col.widgets]; ws[wi] = nw; cols[ci] = { ...col, widgets: ws }; setCols(cols); }}
                  onDelete={() => { const cols = [...row.columns]; cols[ci] = { ...col, widgets: col.widgets.filter((_, k) => k !== wi) }; setCols(cols); }}
                  onMove={(dir) => { const ws = [...col.widgets]; const j = wi + dir; if (j < 0 || j >= ws.length) return; [ws[wi], ws[j]] = [ws[j], ws[wi]]; const cols = [...row.columns]; cols[ci] = { ...col, widgets: ws }; setCols(cols); }}
                  moveTargets={colTargets.filter((t) => t.index !== ci)}
                  onMoveToColumn={(dest) => { const cols = row.columns.map((c) => ({ ...c, widgets: [...c.widgets] })); cols[ci].widgets = cols[ci].widgets.filter((_, k) => k !== wi); cols[dest].widgets.push(w); setCols(cols); }}
                />
              ))}
              <AddWidget onAdd={(type) => { const cols = [...row.columns]; cols[ci] = { ...col, widgets: [...col.widgets, mkWidget(type)] }; setCols(cols); }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout editor (rows)                                                */
/* ------------------------------------------------------------------ */
export function LayoutEditor({
  rows,
  media,
  onChange,
}: {
  rows: LayoutRow[];
  media: MediaAsset[];
  onChange: (rows: LayoutRow[]) => void;
}) {
  const [presetOpen, setPresetOpen] = useState(false);
  return (
    <div className="mt-2 space-y-3">
      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/15 p-4 text-center text-[12px] text-white/40">No rows yet — add one below to start building.</p>
      )}
      {rows.map((row, i) => (
        <RowCard
          key={row.id}
          row={row}
          media={media}
          index={i}
          total={rows.length}
          onChange={(nr) => onChange(rows.map((r, k) => (k === i ? nr : r)))}
          onDelete={() => onChange(rows.filter((_, k) => k !== i))}
          onMove={(dir) => { const j = i + dir; if (j < 0 || j >= rows.length) return; const next = [...rows]; [next[i], next[j]] = [next[j], next[i]]; onChange(next); }}
        />
      ))}

      <div>
        <button type="button" onClick={() => setPresetOpen((v) => !v)} className="w-full rounded-lg border border-dashed border-[#ff2e73]/40 py-2.5 text-[12px] font-semibold text-[#ff5b93] transition hover:bg-[#ff2e73]/10">
          + Add row
        </button>
        {presetOpen && (
          <div className="mt-2 rounded-lg border border-white/10 bg-black/40 p-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">Choose a column layout</p>
            <div className="grid grid-cols-2 gap-1.5">
              {COLUMN_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => { onChange([...rows, mkRow(p.widths)]); setPresetOpen(false); }} className="flex items-center gap-1 rounded-md border border-white/12 bg-white/[0.03] p-2 hover:border-[#ff2e73]">
                  <span className="flex flex-1 gap-0.5">
                    {p.widths.map((w, i) => (
                      <span key={i} className="h-4 rounded-sm bg-white/25" style={{ flexGrow: w }} />
                    ))}
                  </span>
                  <span className="text-[10px] text-white/50">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
