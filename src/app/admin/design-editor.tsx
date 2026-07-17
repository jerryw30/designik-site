"use client";

import { useState, useTransition } from "react";
import type { DesignModule, GlobalDesign } from "@/cms/design-resources";
import {
  publishDesign,
  saveDesignDraft,
  unpublishDesign,
} from "./design-actions";

type MediaAsset = { id: string; title: string; mimeType: string };
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function DesignEditor({
  id,
  module,
  initialTitle,
  initialStatus,
  initial,
  media,
  previewUrl,
}: {
  id: string;
  module: DesignModule;
  initialTitle: string;
  initialStatus: string;
  initial: GlobalDesign;
  media: MediaAsset[];
  previewUrl: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [value, setValue] = useState(() => clone(initial));
  const [tab, setTab] = useState<
    "content" | "style" | "responsive" | "conditions"
  >("content");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const change = (next: GlobalDesign) => {
    setValue(next);
    setDirty(true);
    setMessage("");
  };
  const save = () =>
    start(async () => {
      await saveDesignDraft(id, module, title, value);
      setDirty(false);
      setMessage("Draft saved");
    });
  const publish = () =>
    start(async () => {
      await publishDesign(id, module, title, value);
      setStatus("PUBLISHED");
      setDirty(false);
      setMessage("Published live");
    });
  const unpublish = () =>
    start(async () => {
      await unpublishDesign(id, module);
      setStatus("DRAFT");
      setMessage("Removed from live website");
    });
  const updateStyle = (key: string, next: unknown) =>
    change({ ...value, style: { ...value.style, [key]: next } });
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[minmax(600px,1fr)_390px] bg-[#25262c]">
      <section className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            className="max-w-md rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-lg font-semibold text-white"
          />
          <div className="flex gap-2">
            <a
              href={previewUrl}
              target="_blank"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white"
            >
              Open preview
            </a>
          </div>
        </div>
        <div className="h-[calc(100vh-9rem)] overflow-hidden rounded-xl bg-white shadow-2xl">
          <iframe
            title="Design draft preview"
            src={previewUrl}
            className="h-full w-full border-0"
          />
        </div>
      </section>
      <aside className="flex max-h-[calc(100vh-4rem)] flex-col border-l border-white/10 bg-[#17181d] text-white">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold">
            {module.replaceAll("-", " ")}
          </h2>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {(["content", "style", "responsive", "conditions"] as const).map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`border-b-2 pb-2 text-xs capitalize ${tab === item ? "border-pink-500 text-white" : "border-transparent text-white/45"}`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "content" ? (
            <RecursiveField
              name="content"
              value={value.content}
              onChange={(content) =>
                change({
                  ...value,
                  content: content as Record<string, unknown>,
                })
              }
              media={media}
            />
          ) : tab === "style" ? (
            <div className="space-y-4">
              <Color
                label="Background"
                value={value.style.backgroundColor}
                onChange={(v) => updateStyle("backgroundColor", v)}
              />
              <Color
                label="Text color"
                value={value.style.textColor}
                onChange={(v) => updateStyle("textColor", v)}
              />
              <Color
                label="Accent color"
                value={value.style.accentColor}
                onChange={(v) => updateStyle("accentColor", v)}
              />
              <Text
                label="Font family"
                value={value.style.fontFamily}
                onChange={(v) => updateStyle("fontFamily", v)}
              />
              {[
                ["width", "Width (%)"],
                ["minHeight", "Minimum height"],
                ["paddingTop", "Padding top"],
                ["paddingRight", "Padding right"],
                ["paddingBottom", "Padding bottom"],
                ["paddingLeft", "Padding left"],
                ["marginTop", "Margin top"],
                ["marginBottom", "Margin bottom"],
                ["gap", "Gap"],
                ["borderWidth", "Border width"],
                ["borderRadius", "Border radius"],
              ].map(([key, label]) => (
                <NumberInput
                  key={key}
                  label={label}
                  value={Number(value.style[key as keyof typeof value.style])}
                  onChange={(v) => updateStyle(key, v)}
                />
              ))}
              <Color
                label="Border color"
                value={value.style.borderColor}
                onChange={(v) => updateStyle("borderColor", v)}
              />
              <Text
                label="Box shadow"
                value={value.style.shadow}
                onChange={(v) => updateStyle("shadow", v)}
              />
              <Color
                label="Hover color"
                value={value.style.hoverColor}
                onChange={(v) => updateStyle("hoverColor", v)}
              />
              <Select
                label="Alignment"
                value={value.style.alignment}
                options={["left", "center", "right"]}
                onChange={(v) => updateStyle("alignment", v)}
              />
              <Select
                label="Animation"
                value={value.style.animation}
                options={["none", "fade", "slide-up", "zoom"]}
                onChange={(v) => updateStyle("animation", v)}
              />
            </div>
          ) : tab === "responsive" ? (
            <div className="space-y-4">
              {[
                ["desktopVisible", "Show on desktop"],
                ["tabletVisible", "Show on tablet"],
                ["mobileVisible", "Show on mobile"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between text-sm text-white/70"
                >
                  {label}
                  <input
                    type="checkbox"
                    checked={Boolean(
                      value.style[key as keyof typeof value.style],
                    )}
                    onChange={(e) => updateStyle(key, e.target.checked)}
                    className="accent-pink-500"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Display location"
                value={value.conditions.location}
                options={["entire-site", "homepage", "blog", "pages", "posts"]}
                onChange={(location) =>
                  change({
                    ...value,
                    conditions: { ...value.conditions, location },
                  })
                }
              />
              <NumberInput
                label="Priority"
                value={value.conditions.priority}
                onChange={(priority) =>
                  change({
                    ...value,
                    conditions: { ...value.conditions, priority },
                  })
                }
              />
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={pending || !dirty}
              onClick={save}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
            >
              Save draft
            </button>
            <button
              disabled={pending}
              onClick={publish}
              className="admin-button disabled:opacity-40"
            >
              Publish
            </button>
          </div>
          {status === "PUBLISHED" && (
            <button
              disabled={pending}
              onClick={unpublish}
              className="mt-2 w-full rounded-lg border border-red-400/25 px-3 py-2 text-xs text-red-300 disabled:opacity-40"
            >
              Unpublish from live site
            </button>
          )}
          <p
            className={`mt-2 min-h-4 text-center text-xs ${dirty ? "text-amber-300" : "text-emerald-300"}`}
          >
            {dirty ? "Unsaved changes" : message}
          </p>
        </div>
      </aside>
    </div>
  );
}

function RecursiveField({
  name,
  value,
  onChange,
  media,
}: {
  name: string;
  value: unknown;
  onChange: (value: unknown) => void;
  media: MediaAsset[];
}) {
  if (Array.isArray(value))
    return (
      <div className="mt-2 space-y-2 rounded-lg border border-white/10 p-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg bg-white/[.04] p-2">
            <div className="mb-2 flex gap-2 text-[10px] uppercase text-white/40">
              <span className="mr-auto">Item {index + 1}</span>
              <button
                disabled={!index}
                onClick={() => {
                  const n = [...value];
                  [n[index - 1], n[index]] = [n[index], n[index - 1]];
                  onChange(n);
                }}
              >
                ↑
              </button>
              <button
                disabled={index === value.length - 1}
                onClick={() => {
                  const n = [...value];
                  [n[index + 1], n[index]] = [n[index], n[index + 1]];
                  onChange(n);
                }}
              >
                ↓
              </button>
              <button
                onClick={() =>
                  onChange([
                    ...value.slice(0, index + 1),
                    clone(item),
                    ...value.slice(index + 1),
                  ])
                }
              >
                Duplicate
              </button>
              <button
                className="text-red-400"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </div>
            <RecursiveField
              name={`${name}-${index}`}
              value={item}
              onChange={(next) =>
                onChange(value.map((entry, i) => (i === index ? next : entry)))
              }
              media={media}
            />
          </div>
        ))}
        <button
          onClick={() =>
            onChange([...value, value.length ? clone(value.at(-1)) : ""])
          }
          className="w-full rounded-lg border border-dashed border-white/15 p-2 text-xs text-white/60"
        >
          + Add item
        </button>
      </div>
    );
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      <div className="mt-2 space-y-3 rounded-lg border border-white/10 p-3">
        {Object.entries(record)
          .filter(([key]) => key !== "_layout")
          .map(([key, child]) => (
            <div key={key}>
              <span className="text-[11px] capitalize text-white/50">
                {key.replace(/([A-Z])/g, " $1")}
              </span>
              <RecursiveField
                name={key}
                value={child}
                onChange={(next) => onChange({ ...record, [key]: next })}
                media={media}
              />
            </div>
          ))}
      </div>
    );
  }
  if (typeof value === "boolean")
    return (
      <label className="mt-2 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-pink-500"
        />
        {value ? "Enabled" : "Disabled"}
      </label>
    );
  if (typeof value === "number")
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="admin-input mt-1"
      />
    );
  const string = String(value ?? "");
  const mediaField = /image|video|photo|avatar|logo|background/i.test(name);
  return (
    <div>
      {string.length > 100 || string.includes("\n") ? (
        <textarea
          value={string}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input mt-1 min-h-20"
        />
      ) : (
        <input
          value={string}
          type={/link|href/i.test(name) ? "url" : "text"}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input mt-1"
        />
      )}
      {mediaField && (
        <select
          value=""
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="admin-input mt-1 text-xs"
        >
          <option value="">Choose from Media Library…</option>
          {media
            .filter((asset) =>
              /video/i.test(name)
                ? asset.mimeType.startsWith("video/")
                : asset.mimeType.startsWith("image/"),
            )
            .map((asset) => (
              <option key={asset.id} value={`/api/media/${asset.id}`}>
                {asset.title}
              </option>
            ))}
        </select>
      )}
    </div>
  );
}
const labelClass = "block text-xs text-white/55";
function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input mt-1"
      />
    </label>
  );
}
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="admin-input mt-1"
      />
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
  onChange: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <span className="mt-1 flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input"
        />
      </span>
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
  onChange: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input mt-1"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
