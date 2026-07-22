import Link from "next/link";
import Image from "next/image";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { adminResources } from "@/db/schema";
import Nav from "@/components/sections/Nav";
import GlobalPopup from "@/components/GlobalPopup";
import { blogChrome } from "@/cms/blog-chrome";
import Footer from "@/components/sections/Footer";
import { assets } from "@/lib/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Designik Journal",
  description: "Ideas, insights, and studio updates from Designik.",
};

export const revalidate = 60;

function postDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = String((await searchParams).q || "")
    .trim()
    .toLowerCase();
  const allPosts = await db
    .select()
    .from(adminResources)
    .where(
      and(
        eq(adminResources.module, "posts"),
        eq(adminResources.status, "PUBLISHED"),
        isNull(adminResources.deletedAt),
      ),
    )
    .orderBy(desc(adminResources.updatedAt));
  const posts = query
    ? allPosts.filter((post) => {
        const data = post.data as {
          excerpt?: string;
          content?: string;
          category?: string;
          tags?: string[];
        };
        return [post.title, data.excerpt, data.content, data.category, ...(data.tags || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
    : allPosts;

  const chrome = await blogChrome();
  const [featured, ...rest] = posts;
  const featuredData = (featured?.data || {}) as { excerpt?: string; category?: string; featuredImage?: string };

  return (
    <>
      <Nav content={chrome.headerContent} />
      <main className="min-h-screen overflow-x-clip bg-white">
        {/* grid + mist texture like the site sections */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0">
          <Image src={assets.bgPortfolioBaked} alt="" width={1440} height={1191} sizes="100vw" className="h-auto w-full" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 pb-24 pt-36 md:pt-44">
          {/* heading — site typography */}
          <div className="text-center">
            <span className="font-display text-[13px] font-medium uppercase tracking-normal text-black md:text-[14px]">
              The Designik Journal
            </span>
            <h1 className="mt-3 font-display uppercase leading-[1.05]">
              <span className="block text-[clamp(44px,6.6vw,77px)] font-semibold text-wine-500">Fresh Thinking</span>
              <span className="block text-[clamp(30px,4.7vw,61px)] font-medium text-black">From The Studio</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] font-sans text-[15px] leading-[22px] text-black/70 md:text-[16px]">
              {query
                ? `${posts.length} result${posts.length === 1 ? "" : "s"} for “${query}”`
                : "Ideas, insights and studio updates — how we make brands hard to ignore."}
            </p>

            {/* search pill */}
            <form action="/blog" className="mx-auto mt-8 flex h-[55px] max-w-[520px] items-center rounded-full bg-blush-100 p-[6px] pl-6 shadow-sm">
              <input
                name="q"
                defaultValue={query}
                aria-label="Search journal"
                placeholder="Search the journal…"
                className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-black outline-none placeholder:text-black/40"
              />
              <button className="group flex h-[43px] items-center gap-2 rounded-full bg-wine-500 px-6 font-display text-[14px] font-semibold uppercase text-white transition hover:bg-wine-600">
                Search
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </form>
          </div>

          {/* featured post */}
          {featured && !query && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-14 grid overflow-hidden rounded-[20px] bg-cream-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] md:grid-cols-[1.15fr_1fr]"
            >
              {featuredData.featuredImage && (
                <div className="relative h-64 overflow-hidden md:h-auto md:min-h-[360px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredData.featuredImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center p-8 md:p-12">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-wine-500 px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-white">
                    {featuredData.category || "Journal"}
                  </span>
                  <span className="font-sans text-[12px] text-black/50">{postDate(featured.updatedAt)}</span>
                </div>
                <h2 className="mt-4 font-display text-[clamp(26px,3vw,40px)] font-semibold uppercase leading-[1.1] text-black">
                  {featured.title}
                </h2>
                <p className="mt-3 max-w-[46ch] font-sans text-[15px] leading-[23px] text-black/70">{featuredData.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-3 font-display text-[14px] font-semibold uppercase text-wine-500">
                  Read Article
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine-500 text-white transition-transform duration-300 group-hover:rotate-45">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </div>
            </Link>
          )}

          {/* grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(query ? posts : rest).map((post) => {
              const data = post.data as { excerpt?: string; category?: string; featuredImage?: string };
              return (
                <Link
                  href={`/blog/${post.slug}`}
                  key={post.id}
                  className="group overflow-hidden rounded-[20px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)] ring-1 ring-black/[0.05] transition-shadow duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative h-52 overflow-hidden bg-blush-100">
                    {data.featuredImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.featuredImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-wide text-wine-500 shadow-sm">
                      {data.category || "Journal"}
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="font-sans text-[12px] text-black/50">{postDate(post.updatedAt)}</span>
                    <h2 className="mt-2 font-display text-[22px] font-semibold uppercase leading-[1.15] text-black">
                      {post.title}
                    </h2>
                    <p className="mt-2.5 font-sans text-[13.5px] leading-[21px] text-black/65 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                      {data.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2.5 font-display text-[13px] font-semibold uppercase text-wine-500">
                      Read More
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush-100 text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {!posts.length && (
            <p className="mt-14 rounded-[20px] border border-dashed border-black/15 bg-white/70 p-14 text-center font-sans text-[15px] text-black/50">
              No published posts yet — publish one from the admin and it appears here.
            </p>
          )}
        </div>
      </main>
      <Footer content={chrome.footerContent} />
      <GlobalPopup design={chrome.popup} />
    </>
  );
}
