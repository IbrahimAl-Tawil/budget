import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { JsonLd } from "@/components/seo/json-ld";
import {
  BLOG_AUTHOR,
  BLOG_POSTS,
  blogBreadcrumbLd,
  blogPostingLd,
  getPostBySlug,
} from "@/lib/blog";

// Pre-render every post at build time; unknown slugs 404 via notFound().
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  // `absolute` bypasses the "otterfund · %s" template so titles stay keyword-first
  // (and the "otterfund vs …" posts don't repeat the brand).
  return {
    title: { absolute: post.title },
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [BLOG_AUTHOR.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd data={[blogPostingLd(post), blogBreadcrumbLd(post)]} />
      <BlogPostView post={post} />
    </>
  );
}
