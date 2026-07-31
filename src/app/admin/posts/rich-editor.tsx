"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * WordPress-classic-style editor for post bodies.
 *
 * Built on contentEditable + document.execCommand. execCommand is formally
 * deprecated but is still implemented everywhere and is what gives the classic
 * editor its feel with no dependency; styleWithCSS is forced on so formatting
 * comes out as <span style="..."> rather than legacy <font> tags, which the
 * post sanitiser (src/lib/rich-text.ts) allowlists.
 *
 * The editable div is uncontrolled — its initial HTML is written once on mount.
 * Re-rendering it from React state on every keystroke would reset the caret to
 * the start of the document mid-typing.
 */

const FONT_SIZES = [
  { label: "Small", value: "13px" },
  { label: "Normal", value: "17px" },
  { label: "Medium", value: "20px" },
  { label: "Large", value: "26px" },
  { label: "Huge", value: "34px" },
];

const COLORS = [
  "#1b1c20", "#4b5563", "#a10140", "#c81a5e", "#db2f73",
  "#b45309", "#047857", "#1d4ed8", "#6d28d9", "#ffffff",
];

const BLOCKS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Quote", value: "blockquote" },
  { label: "Code", value: "pre" },
];

type Props = {
  name: string;
  defaultValue?: string;
  /** Plain-text bodies written before the rich editor get their newlines kept. */
  isHtml?: boolean;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function RichEditor({ name, defaultValue = "", isHtml = true }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedRange = useRef<Range | null>(null);
  const [source, setSource] = useState(false);

  // Seed the editable surface once. Legacy plain-text posts are converted to
  // paragraphs so they survive the round-trip instead of collapsing.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const initial = isHtml
      ? defaultValue
      : defaultValue
          .split(/\n{2,}/)
          .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
          .join("");
    el.innerHTML = initial || "<p><br></p>";
    setValue(el.innerHTML);
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {
      // Older engines without styleWithCSS still format, just with <font>.
    }
    // Mount-only on purpose — see the caret note in the file header.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback(() => {
    if (editorRef.current) setValue(editorRef.current.innerHTML);
  }, []);

  const exec = useCallback(
    (command: string, arg?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, arg);
      sync();
    },
    [sync],
  );

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRange.current = sel.getRangeAt(0);
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const openLink = () => {
    saveSelection();
    const selected = window.getSelection()?.toString() || "";
    setLinkText(selected);
    setLinkUrl("");
    setLinkOpen(true);
  };

  const applyLink = () => {
    let url = linkUrl.trim();
    if (!url) return;
    // A bare domain would otherwise be treated as a relative path.
    if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) url = `https://${url}`;
    editorRef.current?.focus();
    restoreSelection();
    const hasSelection = (window.getSelection()?.toString() || "").length > 0;
    if (hasSelection) {
      document.execCommand("createLink", false, url);
    } else {
      const label = escapeHtml(linkText.trim() || url);
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${url.replace(/"/g, "&quot;")}">${label}</a>`,
      );
    }
    setLinkOpen(false);
    sync();
  };

  // Pasting from Word or another site drags in markup the sanitiser would strip
  // anyway; take the plain text and keep line breaks.
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand(
      "insertHTML",
      false,
      escapeHtml(text).replace(/\n/g, "<br>"),
    );
    sync();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white">
      <input type="hidden" name={name} value={value} />

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5">
        <select
          aria-label="Paragraph format"
          defaultValue="p"
          onChange={(e) => exec("formatBlock", e.target.value)}
          className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-[12.5px]"
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>

        <select
          aria-label="Font size"
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            // execCommand("fontSize") only accepts 1-7, so wrap the selection
            // directly to get an exact px value.
            editorRef.current?.focus();
            const sel = window.getSelection();
            if (sel && sel.rangeCount && !sel.isCollapsed) {
              document.execCommand("fontSize", false, "7");
              editorRef.current
                ?.querySelectorAll('font[size="7"]')
                .forEach((node) => {
                  const span = document.createElement("span");
                  span.style.fontSize = e.target.value;
                  span.innerHTML = node.innerHTML;
                  node.replaceWith(span);
                });
              sync();
            }
            e.target.value = "";
          }}
          className="rounded border border-neutral-300 bg-white px-1.5 py-1 text-[12.5px]"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <Divider />

        <Btn onClick={() => exec("bold")} title="Bold (Ctrl+B)"><b>B</b></Btn>
        <Btn onClick={() => exec("italic")} title="Italic (Ctrl+I)"><i>I</i></Btn>
        <Btn onClick={() => exec("underline")} title="Underline (Ctrl+U)"><u>U</u></Btn>
        <Btn onClick={() => exec("strikeThrough")} title="Strikethrough"><s>S</s></Btn>

        <Divider />

        {/* colour */}
        <div className="group relative">
          <Btn onClick={() => {}} title="Text colour">
            <span className="flex items-center gap-0.5">
              A
              <span className="block h-1 w-3 rounded-sm bg-gradient-to-r from-[#a10140] to-[#1d4ed8]" />
            </span>
          </Btn>
          <div className="invisible absolute left-0 top-full z-30 mt-1 w-[136px] rounded-lg border border-neutral-200 bg-white p-2 shadow-lg group-hover:visible">
            <div className="grid grid-cols-5 gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Text colour ${c}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    exec("foreColor", c);
                  }}
                  style={{ background: c }}
                  className="h-5 w-5 rounded border border-black/15"
                />
              ))}
            </div>
            <label className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
              Custom
              <input
                type="color"
                onChange={(e) => exec("foreColor", e.target.value)}
                className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        <Divider />

        <Btn onClick={() => exec("insertUnorderedList")} title="Bullet list">• ≡</Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Numbered list">1. ≡</Btn>

        <Divider />

        <Btn onClick={() => exec("justifyLeft")} title="Align left">⯇</Btn>
        <Btn onClick={() => exec("justifyCenter")} title="Align centre">≡</Btn>
        <Btn onClick={() => exec("justifyRight")} title="Align right">⯈</Btn>

        <Divider />

        <Btn onClick={openLink} title="Insert link (Ctrl+K)">🔗</Btn>
        <Btn onClick={() => exec("unlink")} title="Remove link">⛓︎</Btn>

        <Divider />

        <Btn onClick={() => exec("removeFormat")} title="Clear formatting">✕</Btn>
        <Btn onClick={() => exec("undo")} title="Undo">↶</Btn>
        <Btn onClick={() => exec("redo")} title="Redo">↷</Btn>

        <button
          type="button"
          onClick={() => {
            // Leaving source view pushes the edited HTML back into the surface.
            if (source && editorRef.current) editorRef.current.innerHTML = value;
            setSource((s) => !s);
          }}
          className={`ml-auto rounded px-2 py-1 text-[12px] font-medium transition ${
            source ? "bg-[#a10140] text-white" : "text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {source ? "Visual" : "HTML"}
        </button>
      </div>

      {/* editing surface */}
      {source ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          className="block min-h-[440px] w-full resize-y border-0 p-4 font-mono text-[12.5px] leading-6 outline-none"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Post content"
          onInput={sync}
          onBlur={sync}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
              e.preventDefault();
              openLink();
            }
          }}
          className="post-rte min-h-[440px] w-full overflow-y-auto p-4 text-[15px] leading-7 text-[#1b1c20] outline-none"
        />
      )}

      {/* link dialog */}
      {linkOpen && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLinkOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
          >
            <h3 className="text-[15px] font-semibold text-[#1b1c20]">Insert link</h3>
            <label className="mt-3 block text-[12.5px] font-medium text-neutral-600">
              URL
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyLink()}
                placeholder="designik.agency or https://…"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-[13px] outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
              />
            </label>
            <label className="mt-3 block text-[12.5px] font-medium text-neutral-600">
              Text to show
              <input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyLink()}
                placeholder="Leave blank to use the URL"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-[13px] outline-none focus:border-[#a10140] focus:ring-2 focus:ring-[#a10140]/15"
              />
            </label>
            <p className="mt-2 text-[11.5px] text-neutral-400">
              External links open in a new tab automatically.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-[12.5px] font-medium text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyLink}
                className="rounded-lg bg-[#a10140] px-3 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-[#b81250]"
              >
                Add link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Btn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // mousedown, not click: clicking the toolbar would otherwise blur the
      // editor and drop the selection before the command runs.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="min-w-[28px] rounded px-1.5 py-1 text-[13px] text-neutral-700 transition hover:bg-neutral-200"
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px bg-neutral-300" />;
