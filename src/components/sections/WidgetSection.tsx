import Image from "next/image";
import PublicForm from "@/components/forms/PublicForm";
import type { FormDefinition } from "@/app/admin/forms/actions";
import { normalizeLayout, type LayoutRow, type LayoutWidget } from "@/cms/layout";
import {
  AccordionWidget,
  CarouselWidget,
  CountdownWidget,
  TabsWidget,
} from "@/components/widgets/InteractiveWidgets";
import { login } from "@/app/admin/actions";

export type WidgetForm = {
  id: string;
  title: string;
  definition: FormDefinition;
};

type Widget = {
  readonly id: string;
  readonly type: string;
  readonly content: string;
  readonly settings: Readonly<Record<string, string | number | boolean>>;
};

const V_ALIGN: Record<string, string> = { top: "flex-start", center: "center", bottom: "flex-end", stretch: "stretch" };

function WidgetItem({ widget, forms }: { widget: LayoutWidget; forms: WidgetForm[] }) {
  const settings = widget.settings;
  return (
    <div
      data-cms-element={widget.id}
      data-desktop-visible={settings.desktopVisible !== false}
      data-tablet-visible={settings.tabletVisible !== false}
      data-mobile-visible={settings.mobileVisible !== false}
      className={`cms-widget cms-animation-${String(settings.animation || "none")}`}
      style={{
        color: String(settings.color || "inherit"),
        backgroundColor: String(settings.backgroundColor || "transparent"),
        fontSize: Number(settings.fontSize || 16),
        fontWeight: Number(settings.fontWeight || 400),
        textAlign: (settings.align || "left") as "left" | "center" | "right",
        width: `${Math.max(1, Math.min(100, Number(settings.width || 100)))}%`,
        marginTop: Number(settings.marginTop || 0),
        marginBottom: Number(settings.marginBottom || 0),
        padding: Number(settings.padding || 0),
        borderWidth: Number(settings.borderWidth || 0),
        borderStyle: "solid",
        borderColor: String(settings.borderColor || "transparent"),
        borderRadius: Number(settings.borderRadius || 0),
        boxShadow: String(settings.shadow || "none"),
        transition: "color .2s, background-color .2s, transform .2s",
        ["--widget-hover-color" as string]: String(settings.hoverColor || settings.color || "inherit"),
        ["--widget-hover-background" as string]: String(settings.hoverBackgroundColor || settings.backgroundColor || "transparent"),
      }}
    >
      <WidgetView widget={widget as Widget} forms={forms} />
    </div>
  );
}

function Row({ row, forms }: { row: LayoutRow; forms: WidgetForm[] }) {
  const s = row.settings;
  return (
    <div
      className="mx-auto flex flex-wrap"
      style={{
        gap: s.gap,
        paddingTop: s.paddingY,
        paddingBottom: s.paddingY,
        paddingLeft: s.paddingX,
        paddingRight: s.paddingX,
        background: s.background !== "transparent" ? s.background : undefined,
        maxWidth: s.maxWidth || undefined,
        alignItems: V_ALIGN[s.verticalAlign] || "flex-start",
      }}
    >
      {row.columns.map((col) => (
        <div
          key={col.id}
          className="flex min-w-0 flex-col gap-5"
          style={{ flexGrow: Math.max(1, col.width), flexBasis: 0, minWidth: 220 }}
        >
          {col.widgets.map((w) => (
            <WidgetItem key={w.id} widget={w} forms={forms} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function WidgetSection({
  content,
  forms = [],
}: {
  content?: unknown;
  forms?: WidgetForm[];
}) {
  const layout = normalizeLayout(content);
  return (
    <section
      style={{
        backgroundColor: layout.backgroundColor,
        paddingTop: layout.paddingTop,
        paddingBottom: layout.paddingBottom,
      }}
    >
      <div className="mx-auto flex flex-col gap-6 px-6" style={{ maxWidth: layout.maxWidth }}>
        {layout.rows.map((row) => (
          <Row key={row.id} row={row} forms={forms} />
        ))}
      </div>
    </section>
  );
}
function WidgetView({
  widget,
  forms,
}: {
  widget: Widget;
  forms: WidgetForm[];
}) {
  const style = {
    color: "inherit",
    fontSize: "inherit",
    textAlign: "inherit" as const,
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
      <div
        className="relative mx-auto w-full"
        style={{ height: Number(widget.settings.height || 320) }}
      >
        <Image
          src={widget.content}
          alt={String(widget.settings.alt || "")}
          fill
          style={{
            objectFit: (["contain", "cover", "fill"].includes(String(widget.settings.fit))
              ? String(widget.settings.fit)
              : "contain") as "contain" | "cover" | "fill",
            objectPosition: String(widget.settings.position || "center"),
          }}
        />
      </div>
    );
  if (widget.type === "video")
    return (
      <video
        src={widget.content}
        controls
        className="mx-auto w-full object-cover"
        style={{ height: Number(widget.settings.height || 320) || undefined }}
      />
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
  if (widget.type === "icon-box" || widget.type === "image-box") {
    const [visual, title, ...description] = widget.content.split("|");
    return (
      <article className="rounded-2xl border border-neutral-200 p-6 text-center">
        {widget.type === "image-box" ? (
          // Administrator-selected Media Library or remote URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visual}
            alt={String(widget.settings.alt || "")}
            className="mb-4 h-48 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="mb-3 text-4xl">{visual || "★"}</div>
        )}
        <h3 className="font-display text-xl font-semibold" style={style}>
          {title || visual}
        </h3>
        {description.length > 0 && (
          <p className="mt-2">{description.join("|")}</p>
        )}
      </article>
    );
  }
  if (widget.type === "star-rating")
    return (
      <div
        className="text-center text-2xl text-orange-brand"
        aria-label={`${widget.content} stars`}
      >
        {"★".repeat(Math.max(0, Math.min(5, Number(widget.content) || 5)))}
      </div>
    );
  if (widget.type === "social-icons")
    return (
      <ul className="flex flex-wrap justify-center gap-4">
        {widget.content.split("\n").map((item, index) => {
          const [label, href = "#"] = item.split("|");
          return (
            <li key={`${label}-${index}`}>
              <a href={href} rel="noreferrer" target="_blank">
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    );
  if (widget.type === "icon-list")
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
  if (widget.type === "testimonial" || widget.type === "blockquote") {
    const [quote, author] = widget.content.split("|");
    return (
      <blockquote
        className="rounded-2xl bg-blush-100 p-6 text-center"
        style={style}
      >
        “{quote}”
        {author && (
          <footer className="mt-3 text-sm font-semibold">— {author}</footer>
        )}
      </blockquote>
    );
  }
  if (widget.type === "alert")
    return (
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-orange-900">
        {widget.content}
      </div>
    );
  if (widget.type === "carousel")
    return (
      <CarouselWidget
        sources={widget.content.split("\n").filter(Boolean)}
        alt={String(widget.settings.alt || "")}
        height={Number(widget.settings.height || 320)}
      />
    );
  if (widget.type === "gallery")
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, Number(widget.settings.columns || 2)))},minmax(0,1fr))`,
          gap: Number(widget.settings.gap || 16),
        }}
      >
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
  if (widget.type === "tabs") return <TabsWidget content={widget.content} />;
  if (widget.type === "accordion")
    return <AccordionWidget content={widget.content} />;
  if (widget.type === "toggle")
    return <AccordionWidget content={widget.content} single />;
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
  if (widget.type === "form") {
    const selected = forms.find(
      (form) => form.id === String(widget.settings.formId || ""),
    );
    return selected ? (
      <div className="mx-auto max-w-xl rounded-2xl border p-6">
        {widget.content && (
          <h3 className="mb-4 font-display text-xl uppercase">
            {widget.content}
          </h3>
        )}
        <PublicForm formId={selected.id} definition={selected.definition} />
      </div>
    ) : (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-neutral-500">
        Select a published form in the widget settings.
      </div>
    );
  }
  if (widget.type === "login")
    return (
      <form
        action={login}
        className="mx-auto grid max-w-xl gap-3 rounded-2xl border p-6"
      >
        <h3 className="font-display text-xl uppercase">{widget.content}</h3>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border p-3"
          placeholder="Email address"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border p-3"
          placeholder="Password"
        />
        <button
          className="rounded-full bg-wine-500 p-3 text-white"
          type="submit"
        >
          Sign in securely
        </button>
      </form>
    );
  if (widget.type === "search")
    return (
      <form action="/blog" method="get" className="mx-auto flex max-w-xl">
        <input
          name="q"
          className="min-w-0 flex-1 rounded-l-full border p-3"
          placeholder="Search"
        />
        <button
          type="submit"
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
    return <CountdownWidget target={widget.content} />;
  if (widget.type === "html")
    return <div dangerouslySetInnerHTML={{ __html: widget.content }} />;
  return null;
}
