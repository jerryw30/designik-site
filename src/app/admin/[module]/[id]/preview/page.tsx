import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import {
  designValue,
  type DesignModule,
  type GlobalDesign,
} from "@/cms/design-resources";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import WidgetSection from "@/components/sections/WidgetSection";

const modules = new Set([
  "headers",
  "footers",
  "popups",
  "templates",
  "saved-sections",
]);
export const dynamic = "force-dynamic";
export default async function DesignPreview({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  if (!(await currentUser())) redirect("/admin/login");
  const { module: input, id } = await params;
  if (!modules.has(input)) notFound();
  const designModule = input as DesignModule;
  const [record] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.id, id),
        eq(adminResources.module, designModule),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!record) notFound();
  return (
    <main className="min-h-screen bg-[#f4f4f5]">
      <div className="sticky top-0 z-50 flex items-center justify-between bg-[#111216] px-5 py-3 text-sm text-white">
        <span>Draft preview · {record.title}</span>
        <span className="text-white/50">
          Changes here are not live until published
        </span>
      </div>
      <Preview
        module={designModule}
        value={designValue(designModule, record.data).draft}
      />
    </main>
  );
}
function Preview({
  module,
  value,
}: {
  module: DesignModule;
  value: GlobalDesign;
}) {
  const style: React.CSSProperties = {
    backgroundColor: value.style.backgroundColor,
    color: value.style.textColor,
    fontFamily: value.style.fontFamily,
    width: `${value.style.width}%`,
    minHeight: value.style.minHeight || undefined,
    padding: `${value.style.paddingTop}px ${value.style.paddingRight}px ${value.style.paddingBottom}px ${value.style.paddingLeft}px`,
    marginTop: value.style.marginTop,
    marginBottom: value.style.marginBottom,
    gap: value.style.gap,
    border: `${value.style.borderWidth}px solid ${value.style.borderColor}`,
    borderRadius: value.style.borderRadius,
    boxShadow: value.style.shadow,
    textAlign: value.style.alignment,
  };
  const globalContent = { ...value.content, _globalStyle: value.style };
  if (module === "headers")
    return (
      <div style={style}>
        <Nav content={globalContent} />
        <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-[#7b0031] to-[#f62f80] text-5xl font-bold text-white">
          Page content
        </div>
      </div>
    );
  if (module === "footers")
    return (
      <div>
        <div className="flex min-h-[55vh] items-center justify-center bg-white text-5xl font-bold text-neutral-200">
          Page content
        </div>
        <div style={style}>
          <Footer content={globalContent} />
        </div>
      </div>
    );
  if (module === "popups")
    return (
      <div className="flex min-h-[calc(100vh-48px)] items-center justify-center bg-gradient-to-br from-neutral-200 to-white">
        <div
          style={style}
          className="relative max-w-xl bg-white p-10 shadow-2xl"
        >
          <button className="absolute right-4 top-3 text-2xl">×</button>
          {Boolean(value.content.image) && (
            // User-managed Media Library assets can have arbitrary dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(value.content.image)}
              alt=""
              className="mb-5 max-h-52 w-full object-cover"
            />
          )}
          <h1 className="text-4xl font-bold">
            {String(value.content.heading || "")}
          </h1>
          <p className="mt-4 text-neutral-600">
            {String(value.content.body || "")}
          </p>
          <a
            href={String(value.content.buttonLink || "#")}
            className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 font-semibold text-white"
          >
            {String(value.content.buttonLabel || "Continue")}
          </a>
        </div>
      </div>
    );
  const content =
    value.content.content && typeof value.content.content === "object"
      ? value.content.content
      : value.content;
  return (
    <div style={style} className="mx-auto mt-10 max-w-6xl bg-white">
      <WidgetSection content={content} />
    </div>
  );
}
