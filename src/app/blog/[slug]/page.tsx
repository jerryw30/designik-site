import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminResources, users } from "@/db/schema";
import Link from "next/link";
import Nav from "@/components/sections/Nav";
import GlobalPopup from "@/components/GlobalPopup";
import { blogChrome } from "@/cms/blog-chrome";
import Footer from "@/components/sections/Footer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.slug, slug),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!post) return {};
  const data = post.data as {
    excerpt?: string;
    featuredImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoCanonical?: string;
    seoOgTitle?: string;
    seoOgDescription?: string;
    seoOgImage?: string;
    seoXTitle?: string;
    seoXDescription?: string;
    seoNoindex?: boolean;
  };
  const title = data.seoTitle || post.title,
    description = data.seoDescription || data.excerpt || "",
    image = data.seoOgImage || data.featuredImage;
  const ogTitle = data.seoOgTitle || title,
    ogDescription = data.seoOgDescription || description;
  return {
    title,
    description,
    alternates: { canonical: data.seoCanonical || `/blog/${post.slug}` },
    robots: data.seoNoindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "article",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: data.seoXTitle || ogTitle,
      description: data.seoXDescription || ogDescription,
      images: image ? [image] : undefined,
    },
  };
}

export const revalidate = 60;
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.slug, slug),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .limit(1);
  if (!post) notFound();
  const data = post.data as {
    excerpt?: string;
    content?: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
  };
  const [author] = post.createdBy
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, post.createdBy))
        .limit(1)
    : [];
  const termSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const chrome = await blogChrome();
  return (
    <>
      <Nav content={chrome.headerContent} />
      <main className="min-h-screen overflow-x-clip bg-white px-5 pb-24 pt-36 md:pt-44">
      <article className="relative z-10 mx-auto max-w-3xl">
        <Link href="/blog" className="font-display text-[13px] font-semibold uppercase text-black/50 transition hover:text-wine-500">
          ← Back to Journal
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/blog/category/${termSlug(data.category || "Uncategorized")}`}
            className="rounded-full bg-wine-500 px-3.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-white transition hover:bg-wine-600"
          >
            {data.category || "Uncategorized"}
          </Link>
          <span className="font-sans text-[13px] text-black/50">
            {post.updatedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <h1 className="mt-4 font-display text-[clamp(36px,5.5vw,60px)] font-semibold uppercase leading-[1.08] text-wine-500">
          {post.title}
        </h1>
        <p className="mt-5 font-sans text-[18px] leading-[29px] text-black/70">
          {data.excerpt}
        </p>
        {author && (
          <Link
            href={`/blog/author/${author.id}`}
            className="mt-5 inline-flex items-center gap-2.5 font-sans text-[14px] font-medium text-black/60 transition hover:text-wine-500"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#a10140] to-[#db2f73] text-[11px] font-bold text-white">
              {author.name.slice(0, 2).toUpperCase()}
            </span>
            By {author.name}
          </Link>
        )}
        {data.featuredImage && (
          // Arbitrary administrator-provided URLs cannot be statically allowlisted.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.featuredImage}
            alt=""
            className="mt-10 w-full rounded-[20px] shadow-[0_18px_45px_rgba(0,0,0,0.1)]"
          />
        )}
        <div className="mt-10 whitespace-pre-wrap font-sans text-[17px] leading-[31px] text-black/85">
          {data.content}
        </div>
        {data.tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Link
                href={`/blog/tag/${termSlug(tag)}`}
                key={tag}
                className="rounded-full bg-blush-100 px-3.5 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wide text-wine-500 transition hover:bg-wine-500 hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
      </article>
      </main>
      <Footer content={chrome.footerContent} />
      <GlobalPopup design={chrome.popup} />
    </>
  );
}
