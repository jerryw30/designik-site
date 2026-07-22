import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/sections/Nav";
import GlobalPopup from "@/components/GlobalPopup";
import { blogChrome } from "@/cms/blog-chrome";
import Footer from "@/components/sections/Footer";
import { assets } from "@/lib/assets";

export type ArchivePost = {
  id: string;
  title: string;
  slug: string;
  data: unknown;
  updatedAt: Date;
};

function postDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Shared archive layout for /blog/category, /blog/tag and /blog/author —
 * same design language as the journal index (Nav, texture, display type,
 * card grid, Footer).
 */
export default async function BlogArchive({
  eyebrow = "The Designik Journal",
  title,
  description,
  posts,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  posts: ArchivePost[];
}) {
  const chrome = await blogChrome();
  return (
    <>
      <Nav content={chrome.headerContent} />
      <main className="min-h-screen overflow-x-clip bg-white">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-0">
          <Image
            src={assets.bgPortfolioBaked}
            alt=""
            width={1440}
            height={1191}
            sizes="100vw"
            className="h-auto w-full"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 pb-24 pt-36 md:pt-44">
          <div className="text-center">
            <span className="font-display text-[13px] font-medium uppercase tracking-normal text-black md:text-[14px]">
              {eyebrow}
            </span>
            <h1 className="mt-3 font-display text-[clamp(38px,5.8vw,68px)] font-semibold uppercase leading-[1.05] text-wine-500">
              {title}
            </h1>
            <p className="mx-auto mt-5 max-w-[560px] font-sans text-[15px] leading-[22px] text-black/70 md:text-[16px]">
              {description ||
                `${posts.length} article${posts.length === 1 ? "" : "s"}`}
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 font-display text-[13px] font-semibold uppercase text-black/50 transition hover:text-wine-500"
            >
              ← Back to Journal
            </Link>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const data = post.data as {
                excerpt?: string;
                category?: string;
                featuredImage?: string;
              };
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
                    <span className="font-sans text-[12px] text-black/50">
                      {postDate(post.updatedAt)}
                    </span>
                    <h2 className="mt-2 font-display text-[22px] font-semibold uppercase leading-[1.15] text-black">
                      {post.title}
                    </h2>
                    <p className="mt-2.5 font-sans text-[13.5px] leading-[21px] text-black/65 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                      {data.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2.5 font-display text-[13px] font-semibold uppercase text-wine-500">
                      Read More
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush-100 text-wine-500 transition-transform duration-300 group-hover:rotate-45">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M4 12L12 4M12 4H5M12 4V11"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
              No published posts in this archive yet.
            </p>
          )}
        </div>
      </main>
      <Footer content={chrome.footerContent} />
      <GlobalPopup design={chrome.popup} />
    </>
  );
}
