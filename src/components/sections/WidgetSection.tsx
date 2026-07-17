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
          className="inline-flex rounded-full bg-wine-500 px-6 py-3 text-white"
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
  if (widget.type === "html")
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {widget.content}
      </div>
    );
  return null;
}
