// /llms.txt: the emerging standard (llmstxt.org) that gives LLMs and AI crawlers
// a clean, curated map of the site in Markdown. Generated from the same content
// source as the pages, so it never drifts. Served as static text at build time.
//
// The literal string "otterfund" is fine here: this is a machine-readable text
// file (like metadata / AI-system-prompt strings), not styled brand UI.

import { getAllPosts, BLOG_DESCRIPTION } from "@/lib/blog";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `${SITE_NAME} (${SITE_TAGLINE}) is a free AI budgeting app built on the Needs / Wants / Savings model. It splits every dollar of income using proven methods like the 50/30/20 rule (and 70/20/10, 60/20/20, and an aggressive saver split), categorizes spending automatically, funds savings goals by priority, and includes a calm AI financial advisor. It is free to start with no credit card; paid plans add automatic bank sync via Plaid, the AI advisor, and investment tracking.`,
    "",
    "## Product",
    "",
    `- [${SITE_NAME}](${absoluteUrl("/")}): Free AI budgeting app for Needs, Wants, and Savings.`,
    `- [Pricing](${absoluteUrl("/pricing")}): Free and paid plans (Free, Standard, Pro).`,
    "",
    "## Blog",
    "",
    `${BLOG_DESCRIPTION}`,
    "",
    ...posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.description}`),
    "",
    "## Key facts",
    "",
    "- Free to start, no credit card required.",
    "- Native support for the 50/30/20 rule and other Needs / Wants / Savings splits.",
    "- Automatic spending categorization and savings goals funded by priority.",
    "- Secure bank connections via Plaid; access tokens encrypted at rest.",
    "- A calm AI financial advisor that gives plain-language guidance, never lectures.",
    "- Net worth and investment tracking on paid plans.",
    "- Financial data is private by default and never sold.",
    "",
    "## Legal",
    "",
    `- [Privacy Policy](${absoluteUrl("/privacy")})`,
    `- [Terms of Service](${absoluteUrl("/terms")})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
