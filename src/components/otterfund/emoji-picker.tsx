"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { Twemoji } from "./twemoji";

// Curated, goal-relevant set grouped into categories. A constrained set is
// intentional: the value always lands as exactly one emoji, so the goal ring
// (see pages/goals.tsx) can never be fed multiple glyphs or arbitrary text.
// Categories act as the picker's "pages" — the tab strip jumps between them.
const EMOJI_GROUPS = [
  { label: "Goals", icon: "🎯", emoji: ["🎯", "🏆", "🚀", "🛟", "📈", "🧾"] },
  { label: "Home", icon: "🏠", emoji: ["🏠", "🏡", "🔑", "🛋️", "🛏️", "🚪", "🧱", "🌱"] },
  { label: "Travel", icon: "✈️", emoji: ["✈️", "🏖️", "🏝️", "⛺", "🗺️", "🧳", "🚢", "🎡", "🗽", "🏔️"] },
  { label: "Money", icon: "💰", emoji: ["💰", "💵", "💳", "🏦", "🪙", "💼"] },
  { label: "Ride", icon: "🚗", emoji: ["🚗", "🚙", "🚲", "🏍️", "🛵", "⛵", "🛥️"] },
  { label: "Life", icon: "❤️", emoji: ["💍", "👶", "🎓", "❤️", "🎁", "🐶", "🐱", "🏥", "💐", "🎂"] },
  { label: "Play", icon: "🎮", emoji: ["📱", "💻", "🎸", "🎮", "📷", "🎧", "⌚", "👟", "🎨", "📚", "⚽", "🎬"] },
] as const;

function groupOf(emoji: string): number {
  if (!emoji) return 0;
  const i = EMOJI_GROUPS.findIndex((g) => (g.emoji as readonly string[]).includes(emoji));
  return i < 0 ? 0 : i;
}

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  /** Visible label rendered above the trigger. */
  label?: string;
}

export function EmojiPicker({ value, onChange, label = "Emoji" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(() => groupOf(value));
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape — the popover is non-modal so the rest of
  // the form stays interactive.
  useEffect(() => {
    if (!open) return;
    // Open onto the category that holds the current value.
    setGroup(groupOf(value));
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, value]);

  const pick = (emoji: string) => {
    onChange(emoji === value ? "" : emoji);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-of-faint)] mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `Emoji: ${value}. Change` : "Choose an emoji"}
        className="flex w-full h-11 items-center justify-center rounded-xl border border-[var(--color-of-line)] bg-[var(--color-of-field)] px-3 text-lg text-[var(--color-of-ink)] outline-none transition-colors hover:border-[var(--color-of-muted)] focus:border-[var(--color-primary)] cursor-pointer"
      >
        {/* Empty state: a monochrome outline icon, NOT a real emoji — a
            full-color glyph reads as an assigned value (emoji also ignore
            `color:`, so tinting can't fade them). Grey line-work in the app's
            lucide language says "empty, tap to add". */}
        {value ? (
          <Twemoji emoji={value} size={22} />
        ) : (
          <SmilePlus
            size={19}
            strokeWidth={1.9}
            className="text-[var(--color-of-faint)]"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose an emoji"
          className="of-enter absolute z-50 mt-2 left-0 w-[288px] rounded-2xl border border-[var(--color-of-line)] bg-[var(--color-of-surface)] p-3 shadow-[0_12px_32px_oklch(20%_0.02_80/0.12)]"
        >
          {/* Category tabs — one representative glyph each, sized to fit with
              no horizontal scroll. Each is a "page" of the curated set. */}
          <div
            role="tablist"
            aria-label="Emoji categories"
            className="mb-2 grid grid-cols-7 gap-0.5 border-b border-[var(--color-of-line-soft)] pb-2"
          >
            {EMOJI_GROUPS.map((g, i) => {
              const active = i === group;
              return (
                <button
                  key={g.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={g.label}
                  title={g.label}
                  onClick={() => setGroup(i)}
                  className={`flex h-8 items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "bg-[var(--color-accent)] ring-1 ring-[var(--color-primary)]"
                      : "opacity-55 hover:opacity-100 hover:bg-[var(--color-of-hover)]"
                  }`}
                >
                  <Twemoji emoji={g.icon} size={18} />
                </button>
              );
            })}
          </div>

          {/* Active category name — makes the icon tabs unambiguous. */}
          <div className="mb-1.5 px-0.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--color-of-faint)]">
            {EMOJI_GROUPS[group].label}
          </div>

          {/* Grid for the active category. Fixed min-height keeps the popover
              from jumping as categories of different sizes swap in. Every
              category fits in two rows, so nothing scrolls. */}
          <div className="grid min-h-[80px] grid-cols-6 gap-1">
            {EMOJI_GROUPS[group].emoji.map((emoji) => {
              const active = emoji === value;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => pick(emoji)}
                  aria-pressed={active}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                    active
                      ? "bg-[var(--color-accent)] ring-1 ring-[var(--color-primary)]"
                      : "hover:bg-[var(--color-of-hover)]"
                  }`}
                >
                  <Twemoji emoji={emoji} size={22} />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => pick("")}
            className="mt-2 w-full h-8 rounded-lg text-[12.5px] font-medium text-[var(--color-of-muted)] hover:bg-[var(--color-of-hover)] transition-colors"
          >
            ✕ None
          </button>
        </div>
      )}
    </div>
  );
}
