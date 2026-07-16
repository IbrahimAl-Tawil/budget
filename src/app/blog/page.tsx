import type { Metadata } from "next";
import { BlogIndexView } from "@/components/blog/blog-index-view";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_DESCRIPTION, blogListingLd, getAllPosts } from "@/lib/blog";
import { KEYWORDS, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog: Budgeting Guides and App Comparisons",
  description: BLOG_DESCRIPTION,
  keywords: [...KEYWORDS.compare, ...KEYWORDS.budgeting, ...KEYWORDS.allocating],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: `Blog · ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    url: "/blog",
  },
};

// Public, statically generated marketing surface. No auth guard: the blog is the
// top of the funnel, meant to be crawled and shared.
export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <>
      <JsonLd data={blogListingLd()} />
      <BlogIndexView posts={posts} />
    </>
  );
}
