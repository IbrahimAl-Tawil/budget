"use client";

import { useState } from "react";

// Convert an emoji string to Twemoji's hyphen-joined hex codepoint filename.
// Mirrors twemoji's own algorithm so the file we ship lines up with the glyph.
function toCodePoint(str: string): string {
  const parts: string[] = [];
  let high = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (high) {
      parts.push((0x10000 + ((high - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      high = 0;
    } else if (c >= 0xd800 && c <= 0xdbff) {
      high = c;
    } else {
      parts.push(c.toString(16));
    }
  }
  return parts.join("-");
}

// Twemoji drops the U+FE0F variation selector unless the sequence is a ZWJ
// (U+200D) sequence — none of ours are, but keep the rule intact for safety.
function twemojiFile(emoji: string): string {
  const normalized = emoji.indexOf("‍") < 0 ? emoji.replace(/️/g, "") : emoji;
  return toCodePoint(normalized);
}

interface TwemojiProps {
  emoji: string;
  /** Rendered box size in px (width = height). */
  size?: number;
  className?: string;
  /**
   * Screen-reader label. Omit to treat the glyph as decorative (aria-hidden) —
   * which is right everywhere it sits beside the goal's own name.
   */
  alt?: string;
}

/**
 * Renders an emoji as a self-hosted Twemoji SVG so a goal's glyph looks
 * identical on macOS, Windows and Android instead of deferring to each OS's
 * native emoji font. The curated set lives in `public/twemoji/`; anything we
 * don't ship falls back to the platform glyph.
 */
export function Twemoji({ emoji, size = 20, className, alt }: TwemojiProps) {
  // Track failure by src, not a bare boolean — a shared instance whose emoji
  // prop later changes must re-attempt the new glyph rather than staying on the
  // native fallback from a previous miss.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!emoji) return null;

  const src = `/twemoji/${twemojiFile(emoji)}.svg`;
  if (failedSrc === src) {
    return (
      <span
        className={className}
        style={{ fontSize: size, lineHeight: 1 }}
        aria-hidden={alt ? undefined : true}
      >
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      onError={() => setFailedSrc(src)}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.125em" }}
    />
  );
}
