
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import { assets } from "@/lib/assets";

import blogData from "@/data/blog-posts.json";

export const metadata: Metadata = {
  title: "Designik Journal | Designik Agency",
  description:
    "Ideas, insights, and studio updates from Designik.",
};

type BlogPost = {
  slug: string;
  title: string;
  updatedAt: string;
  excerpt: string;
  category: string;
  featuredImage: string;
  tags: string[];
};

const posts = blogData.posts as BlogPost[];

function postDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mediaUrl(url: string) {
  return url
    .replaceAll("/api/static/figma/", "/figma/")
    .replaceAll("/api/static/video/", "/video/");
}

export default function BlogPage() {
  const [featured, ...remainingPosts] = posts;

  return (
    <>
      <Nav />

      <main className="relative min-h-screen overflow-x-clip bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0"
        >
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
          {/* Blog heading */}
          <div className="text-center">
            <span className="font-display text-[13px] font-medium uppercase text-black md:text-[14px]">
              The Designik Journal
            </span>

            <h1 className="mt-3 font-display uppercase leading-[1.05]">
              <span className="block text-[clamp(44px,6.6vw,77px)] font-semibold text-wine-500">
                Fresh Thinking
              </span>

              <span className="block text-[clamp(30px,4.7vw,61px)] font-medium text-black">
                From The Studio
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[560px] font-sans text-[15px] leading-[22px] text-black/70 md:text-[16px]">
              Ideas, insights and studio updates — how we make
              brands hard to ignore.
            </p>
          </div>

          {/* Featured article */}
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-14 grid overflow-hidden rounded-[20px] bg-cream-100 shadow-sm transition-shadow hover:shadow-xl md:grid-cols-2"
            >
              <div className="relative min-h-[260px] overflow-hidden bg-blush-100 md:min-h-[360px]">
                {featured.featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(featured.featuredImage)}
                    alt={featured.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </div>

              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="font-display text-sm font-semibold uppercase text-wine-500">
                  {featured.category || "Journal"}
                </span>

                <span className="mt-2 text-xs text-black/50">
                  {postDate(featured.updatedAt)}
                </span>

                <h2 className="mt-4 font-display text-3xl font-semibold uppercase leading-tight text-black md:text-4xl">
                  {featured.title}
                </h2>

                <p className="mt-4 text-[15px] leading-7 text-black/65">
                  {featured.excerpt}
                </p>

                <span className="mt-6 font-display font-semibold uppercase text-wine-500">
                  Read Article →
                </span>
              </div>
            </Link>
          )}

          {/* Remaining articles */}
          {remainingPosts.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-xl"
                >
                  <div className="relative h-52 overflow-hidden bg-blush-100">
                    {post.featuredImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(post.featuredImage)}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>

                  <div className="p-6">
                    <span className="font-display text-xs font-semibold uppercase text-wine-500">
                      {post.category || "Journal"}
                    </span>

                    <p className="mt-2 text-xs text-black/50">
                      {postDate(post.updatedAt)}
                    </p>

                    <h2 className="mt-3 font-display text-2xl font-semibold uppercase leading-tight text-black">
                      {post.title}
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-black/65">
                      {post.excerpt}
                    </p>

                    <span className="mt-5 inline-block font-display text-sm font-semibold uppercase text-wine-500">
                      Read More →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {posts.length === 0 && (
            <div className="mt-14 rounded-[20px] border border-dashed border-black/15 bg-white/80 px-6 py-16 text-center shadow-sm">
              <h2 className="font-display text-3xl font-semibold uppercase text-wine-500">
                The Journal
              </h2>

              <p className="mx-auto mt-4 max-w-lg font-sans text-[15px] leading-7 text-black/60">
                No published articles yet. New insights and
                studio updates will appear here when published.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
