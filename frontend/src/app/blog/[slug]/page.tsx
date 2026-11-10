
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Nav from "@/components/sections/Nav";
import Footer from "@/components/sections/Footer";
import {
  isHtmlContent,
  sanitizePostHtml,
} from "@/lib/rich-text";

import blogData from "@/data/blog-posts.json";

type BlogPost = {
  slug: string;
  title: string;
  updatedAt: string;
  excerpt: string;
  content: string;
  category: string;
  featuredImage: string;
  tags: string[];
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

const posts = blogData.posts as BlogPost[];

// Static hosting cannot generate new article paths on demand.
export const dynamicParams = false;

// Next.js static export needs at least one generated path.
// This internal fallback returns a 404 and is not a real post.
const EMPTY_SLUG = "__no_published_posts__";

export function generateStaticParams() {
  if (posts.length === 0) {
    return [{ slug: EMPTY_SLUG }];
  }

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

function mediaUrl(value: string) {
  return value
    .replaceAll("/api/static/figma/", "/figma/")
    .replaceAll("/api/static/video/", "/video/");
}

function formattedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${post.title} | Designik Journal`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogArticlePage({
  params,
}: PageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const content = mediaUrl(post.content || "");

  const safeHtml = isHtmlContent(content)
    ? sanitizePostHtml(content)
    : null;

  return (
    <>
      <Nav />

      <main className="min-h-screen overflow-x-clip bg-white px-5 pb-24 pt-36 md:pt-44">
        <article className="relative z-10 mx-auto max-w-3xl">

          <Link
            href="/blog"
            className="font-display text-[13px] font-semibold uppercase text-black/50 transition hover:text-wine-500"
          >
            ← Back to Journal
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-wine-500 px-4 py-1.5 font-display text-xs font-semibold uppercase text-white">
              {post.category || "Journal"}
            </span>

            <span className="font-sans text-sm text-black/50">
              {formattedDate(post.updatedAt)}
            </span>
          </div>

          <h1 className="mt-6 font-display text-[clamp(36px,5.5vw,60px)] font-semibold uppercase leading-[1.08] text-wine-500">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 font-sans text-lg leading-8 text-black/70">
              {post.excerpt}
            </p>
          )}

          {post.featuredImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(post.featuredImage)}
              alt={post.title}
              className="mt-10 w-full rounded-[20px] object-cover shadow-xl"
            />
          )}

          {safeHtml !== null ? (
            <div
              className="post-body mt-12 font-sans text-[17px] leading-[31px] text-black/85"
              dangerouslySetInnerHTML={{
                __html: safeHtml,
              }}
            />
          ) : (
            <div className="mt-12 whitespace-pre-wrap font-sans text-[17px] leading-[31px] text-black/85">
              {content}
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blush-100 px-4 py-2 font-display text-xs font-semibold uppercase text-wine-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-14 border-t border-black/10 pt-8">
            <Link
              href="/blog"
              className="font-display text-sm font-semibold uppercase text-wine-500"
            >
              ← Explore More Articles
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
