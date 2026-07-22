"use client";
import { useState, useTransition } from "react";
import type { GlobalStyles } from "@/cms/global-styles";
import { T } from "../theme";
import {
  publishGlobalStyles,
  resetGlobalStylesDraft,
  saveGlobalStylesDraft,
} from "./actions";
type Tab = "colors" | "typography" | "buttons" | "layout" | "fonts";
export default function StyleEditor({ initial }: { initial: GlobalStyles }) {
  const [value, setValue] = useState(initial),
    [tab, setTab] = useState<Tab>("colors"),
    [message, setMessage] = useState(""),
    [pending, start] = useTransition();
  const save = () =>
      start(async () => {
        await saveGlobalStylesDraft(value);
        setMessage("Draft saved");
      }),
    publish = () =>
      start(async () => {
        await publishGlobalStyles(value);
        setMessage("Published live");
      }),
    reset = () =>
      start(async () => {
        const defaults = await resetGlobalStylesDraft();
        setValue(defaults);
        setMessage("Draft reset to website defaults");
      });
  const color = (key: keyof GlobalStyles["colors"], label: string) => (
    <label className="block">
      <span className={T.label}>{label}</span>
      <div className="flex gap-2">
        <input
          type="color"
          value={value.colors[key]}
          onChange={(e) =>
            setValue({
              ...value,
              colors: { ...value.colors, [key]: e.target.value },
            })
          }
          className="h-[38px] w-12 shrink-0 cursor-pointer rounded-lg border border-neutral-300 bg-white p-1"
        />
        <input
          value={value.colors[key]}
          onChange={(e) =>
            setValue({
              ...value,
              colors: { ...value.colors, [key]: e.target.value },
            })
          }
          className={`min-w-0 flex-1 ${T.input}`}
        />
      </div>
    </label>
  );
  const number = (
    group: "typography" | "buttons" | "layout",
    key: string,
    label: string,
    step = 1,
  ) => (
    <label className="block">
      <span className={T.label}>{label}</span>
      <input
        type="number"
        step={step}
        value={Number(
          (value[group] as unknown as Record<string, unknown>)[key],
        )}
        onChange={(e) =>
          setValue({
            ...value,
            [group]: { ...value[group], [key]: Number(e.target.value) },
          })
        }
        className={T.input}
      />
    </label>
  );
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_390px]">
      <section className={T.cardPad}>
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            ["colors", "typography", "buttons", "layout", "fonts"] as Tab[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium capitalize transition ${
                tab === item
                  ? "bg-gradient-to-r from-[#a10140] to-[#c81a5e] text-white shadow-[0_4px_14px_rgba(161,1,64,0.25)]"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#a10140]/40 hover:text-[#a10140]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {tab === "colors" && (
            <>
              {color("primary", "Primary brand color")}
              {color("secondary", "Secondary brand color")}
              {color("accent", "Accent color")}
              {color("text", "Text color")}
              {color("background", "Page background")}
            </>
          )}
          {tab === "typography" && (
            <>
              <label className="block md:col-span-2">
                <span className={T.label}>Body font family</span>
                <input
                  value={value.typography.bodyFamily}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      typography: {
                        ...value.typography,
                        bodyFamily: e.target.value,
                      },
                    })
                  }
                  className={T.input}
                />
              </label>
              <label className="block md:col-span-2">
                <span className={T.label}>Heading font family</span>
                <input
                  value={value.typography.headingFamily}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      typography: {
                        ...value.typography,
                        headingFamily: e.target.value,
                      },
                    })
                  }
                  className={T.input}
                />
              </label>
              <label className="block md:col-span-2">
                <span className={T.label}>Marquee font family</span>
                <input
                  value={value.typography.marqueeFamily}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      typography: {
                        ...value.typography,
                        marqueeFamily: e.target.value,
                      },
                    })
                  }
                  className={T.input}
                />
              </label>
              {number("typography", "bodySize", "Body size")}
              {number("typography", "bodyLineHeight", "Body line height", 0.1)}
              {number("typography", "headingWeight", "Heading weight", 100)}
            </>
          )}
          {tab === "buttons" && (
            <>
              {number("buttons", "radius", "Border radius")}
              {number("buttons", "paddingX", "Horizontal padding")}
              {number("buttons", "paddingY", "Vertical padding")}
              {number("buttons", "fontWeight", "Font weight", 100)}
            </>
          )}
          {tab === "layout" && (
            <>
              {number("layout", "containerWidth", "Container width")}
              {number("layout", "sectionGap", "Default section gap")}
            </>
          )}
          {tab === "fonts" && (
            <div className="space-y-3 md:col-span-2">
              {value.customFonts.map((font, index) => (
                <div
                  key={font.id}
                  className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 md:grid-cols-2"
                >
                  <input
                    value={font.name}
                    placeholder="Font name"
                    onChange={(e) =>
                      setValue({
                        ...value,
                        customFonts: value.customFonts.map((item, i) =>
                          i === index
                            ? { ...item, name: e.target.value }
                            : item,
                        ),
                      })
                    }
                    className={T.input}
                  />
                  <input
                    value={font.url}
                    placeholder="HTTPS font file URL"
                    onChange={(e) =>
                      setValue({
                        ...value,
                        customFonts: value.customFonts.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      })
                    }
                    className={T.input}
                  />
                  <input
                    type="number"
                    min="100"
                    max="900"
                    step="100"
                    value={font.weight}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        customFonts: value.customFonts.map((item, i) =>
                          i === index
                            ? { ...item, weight: Number(e.target.value) }
                            : item,
                        ),
                      })
                    }
                    className={T.input}
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={font.style}
                      onChange={(e) =>
                        setValue({
                          ...value,
                          customFonts: value.customFonts.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  style: e.target.value as "normal" | "italic",
                                }
                              : item,
                          ),
                        })
                      }
                      className={`min-w-0 flex-1 ${T.select}`}
                    >
                      <option>normal</option>
                      <option>italic</option>
                    </select>
                    <button
                      onClick={() =>
                        setValue({
                          ...value,
                          customFonts: value.customFonts.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                      className={`text-[13px] ${T.dangerLink}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() =>
                  setValue({
                    ...value,
                    customFonts: [
                      ...value.customFonts,
                      {
                        id: crypto.randomUUID(),
                        name: "Custom Font",
                        url: "",
                        weight: 400,
                        style: "normal",
                      },
                    ],
                  })
                }
                className="w-full rounded-xl border border-dashed border-neutral-300 p-3 text-[13px] font-medium text-neutral-500 transition hover:border-[#a10140]/50 hover:text-[#a10140]"
              >
                + Add custom font
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/[0.05] pt-5">
          <button disabled={pending} onClick={save} className={T.btn}>
            Save draft
          </button>
          <button
            disabled={pending}
            onClick={publish}
            className={T.btnPrimary}
          >
            Publish globally
          </button>
          <button
            disabled={pending}
            onClick={reset}
            className={`ml-auto text-[13px] ${T.dangerLink}`}
          >
            Reset draft
          </button>
        </div>
        <p className="mt-3 text-[13px] font-medium text-emerald-600">
          {message}
        </p>
      </section>
      <aside>
        <div
          style={{
            background: value.colors.background,
            color: value.colors.text,
            fontFamily: value.typography.bodyFamily,
            fontSize: value.typography.bodySize,
            lineHeight: value.typography.bodyLineHeight,
          }}
          className="sticky top-24 overflow-hidden rounded-xl border border-black/[0.06] p-6 shadow-[0_1px_3px_rgba(16,17,22,0.05)]"
        >
          <span
            style={{ color: value.colors.accent }}
            className="text-[12px] font-semibold uppercase tracking-[0.08em]"
          >
            Live preview
          </span>
          <h2
            style={{
              fontFamily: value.typography.headingFamily,
              fontWeight: value.typography.headingWeight,
              color: value.colors.secondary,
            }}
            className="mt-3 text-4xl"
          >
            Designik Heading
          </h2>
          <p className="mt-3">
            Body typography and global colors preview here before publishing.
          </p>
          <button
            style={{
              background: value.colors.primary,
              borderRadius: value.buttons.radius,
              padding: `${value.buttons.paddingY}px ${value.buttons.paddingX}px`,
              fontWeight: value.buttons.fontWeight,
            }}
            className="mt-5 text-white"
          >
            Global button
          </button>
        </div>
      </aside>
    </div>
  );
}
