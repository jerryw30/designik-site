import Image from "next/image";
import { sectionContent } from "@/cms/section-defaults";

type Widget = {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly settings: Readonly<Record<string, string | number>>;
};
export default function WidgetSection({ content }: { content?: unknown }) {
  const data = sectionContent("widgets", content);
  return (
    <section
      style={{
        backgroundColor: data.backgroundColor,
        paddingTop: data.paddingTop,
        paddingBottom: data.paddingBottom,
      }}
    >
      <div
        className="mx-auto flex flex-col gap-5 px-6"
        style={{ maxWidth: data.maxWidth }}
      >
        {(data.widgets as ReadonlyArray<Widget>).map((widget) => (
          <WidgetView key={widget.id} widget={widget} />
        ))}
      </div>
    </section>
  );
}
function WidgetView({ widget }: { widget: Widget }) {
  const style = {
    color: String(widget.settings.color || "inherit"),
    fontSize: Number(widget.settings.fontSize || 16),
    textAlign: (widget.settings.align || "left") as "left" | "center" | "right",
  };
  if (widget.type === "heading")
    return (
      <h2 className="font-display font-semibold uppercase" style={style}>
        {widget.content}
      </h2>
    );
  if (widget.type === "text") return <p style={style}>{widget.content}</p>;
  if (widget.type === "button")
    return (
      <div style={{ textAlign: style.textAlign }}>
        <a
          className="cms-global-button inline-flex bg-wine-500 text-white"
          href={String(widget.settings.href || "#")}
        >
          {widget.content}
        </a>
      </div>
    );
  if (widget.type === "image")
    return (
      <div className="relative mx-auto h-80 w-full">
        <Image
          src={widget.content}
          alt={String(widget.settings.alt || "")}
          fill
          className="object-contain"
        />
      </div>
    );
  if (widget.type === "video")
    return (
      <video src={widget.content} controls className="mx-auto max-w-full" />
    );
  if (widget.type === "divider") return <hr className="border-neutral-300" />;
  if (widget.type === "spacer")
    return <div style={{ height: Number(widget.settings.height || 40) }} />;
  if (widget.type === "icon")
    return (
      <div style={style} aria-label="Icon">
        {widget.content}
      </div>
    );
  if (widget.type === "icon-box" || widget.type === "image-box")
    return (
      <article className="rounded-2xl border border-neutral-200 p-6 text-center">
        <div className="mb-3 text-4xl">
          {widget.type === "icon-box" ? "★" : "▧"}
        </div>
        <h3 style={style}>{widget.content}</h3>
      </article>
    );
  if (widget.type === "star-rating")
    return (
      <div
        className="text-center text-2xl text-orange-brand"
        aria-label={`${widget.content} stars`}
      >
        {"★".repeat(Math.max(0, Math.min(5, Number(widget.content) || 5)))}
      </div>
    );
  if (widget.type === "icon-list" || widget.type === "social-icons")
    return (
      <ul className="flex flex-wrap justify-center gap-4">
        {widget.content.split("\n").map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    );
  if (widget.type === "counter")
    return (
      <strong className="block text-center font-display" style={style}>
        {widget.content}
      </strong>
    );
  if (widget.type === "progress")
    return (
      <div>
        <div className="mb-1 text-sm">{widget.content}%</div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-wine-500"
            style={{
              width: `${Math.max(0, Math.min(100, Number(widget.content) || 0))}%`,
            }}
          />
        </div>
      </div>
    );
  if (widget.type === "testimonial" || widget.type === "blockquote")
    return (
      <blockquote
        className="rounded-2xl bg-blush-100 p-6 text-center"
        style={style}
      >
        “{widget.content}”
      </blockquote>
    );
  if (widget.type === "alert")
    return (
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-orange-900">
        {widget.content}
      </div>
    );
  if (widget.type === "gallery" || widget.type === "carousel")
    return (
      <div className="grid grid-cols-2 gap-4">
        {widget.content
          .split("\n")
          .filter(Boolean)
          .map((src) => (
            <div key={src} className="relative h-56">
              <Image
                src={src}
                alt=""
                fill
                className="rounded-xl object-cover"
              />
            </div>
          ))}
      </div>
    );
  if (widget.type === "audio")
    return <audio src={widget.content} controls className="w-full" />;
  if (["tabs", "accordion", "toggle"].includes(widget.type)) {
    const [title, ...body] = widget.content.split("\n");
    return (
      <details className="rounded-xl border border-neutral-200 p-4">
        <summary className="cursor-pointer font-semibold">{title}</summary>
        <p className="mt-3">{body.join("\n")}</p>
      </details>
    );
  }
  if (widget.type === "map")
    return (
      <a
        href={widget.content}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl bg-neutral-100 p-10 text-center underline"
      >
        Open map
      </a>
    );
  if (widget.type === "form" || widget.type === "login")
    return (
      <form className="mx-auto grid max-w-xl gap-3 rounded-2xl border p-6">
        <h3 className="font-display text-xl uppercase">{widget.content}</h3>
        <input
          className="rounded-lg border p-3"
          placeholder="Email"
          type="email"
        />
        <textarea className="rounded-lg border p-3" placeholder="Message" />
        <button
          className="rounded-full bg-wine-500 p-3 text-white"
          type="button"
        >
          Submit
        </button>
      </form>
    );
  if (widget.type === "search")
    return (
      <form className="mx-auto flex max-w-xl">
        <input
          className="min-w-0 flex-1 rounded-l-full border p-3"
          placeholder="Search"
        />
        <button
          type="button"
          className="rounded-r-full bg-wine-500 px-6 text-white"
        >
          Search
        </button>
      </form>
    );
  if (widget.type === "menu-anchor")
    return (
      <span id={widget.content.replace(/[^a-z0-9-]/gi, "-").toLowerCase()} />
    );
  if (widget.type === "countdown")
    return (
      <div className="text-center font-display text-4xl" style={style}>
        {widget.content}
      </div>
    );
  if (widget.type === "html")
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {widget.content}
      </div>
    );
  return null;
}
