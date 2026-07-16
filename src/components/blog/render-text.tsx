// Shared inline renderer for blog copy. Turns a plain content string into JSX:
//   · `[[of]]` (the body token) and any literal "otterfund" -> <Wordmark />
//   · `**bold**` -> <strong>
// Keeps metadata/SEO strings plain (they never pass through here) while every
// VISIBLE string (titles, excerpts, body) renders the brand as the wordmark, per
// the otterfund brand rule.

import { Fragment } from "react";
import { Wordmark } from "@/components/otterfund/wordmark";

const TOKEN = /(\[\[of\]\]|\botterfund\b|\*\*[^*]+\*\*)/g;

export function renderText(text: string, keyPrefix: string): React.ReactNode {
  return text.split(TOKEN).map((seg, i) => {
    if (!seg) return null;
    const key = `${keyPrefix}-${i}`;
    if (seg === "[[of]]" || seg === "otterfund") return <Wordmark key={key} />;
    const bold = seg.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={key} className="font-semibold text-[var(--color-of-ink)]">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={key}>{seg}</Fragment>;
  });
}
