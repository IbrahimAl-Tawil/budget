"use client";

import { useEffect, useState } from "react";
import { LOGO_CORAL } from "@/components/otterfund/theme";

/* Coral otter that blinks by cross-toggling two hand-drawn frames (eyes open /
   eyes closed). BOTH frames are stacked and their masks decoded from mount; we
   only flip which one is at opacity 1. That's a compositor-only swap — no
   mask-image reload, so there's no white flash between frames — and exactly one
   is ever visible, so the two can never both paint at once. It double-blinks
   (two quick blinks), holds eyes open for a beat, then double-blinks again. */
const OPEN = "/insight-otter-open.png";
const CLOSED = "/insight-otter-closed.png";

// One full loop, in ms per step. `true` = eyes closed, `false` = eyes open.
// Double-blink (close/open/close/open), long open pause, then repeat.
const SEQUENCE: Array<{ closed: boolean; hold: number }> = [
  { closed: true, hold: 110 },   // blink 1: close
  { closed: false, hold: 130 },  // blink 1: open
  { closed: true, hold: 110 },   // blink 2: close
  { closed: false, hold: 3400 }, // open, long pause before next double-blink
];

export function BlinkingOtter({ width = 104, height = 58 }: { width?: number; height?: number }) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Respect reduced-motion: hold eyes open, never animate.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    let step = 0;
    const tick = () => {
      const { closed: isClosed, hold } = SEQUENCE[step];
      setClosed(isClosed);
      step = (step + 1) % SEQUENCE.length;
      timer = setTimeout(tick, hold);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span aria-hidden style={{ position: "relative", display: "block", width, height }}>
      {([
        [OPEN, closed ? 0 : 1],
        [CLOSED, closed ? 1 : 0],
      ] as const).map(([src, opacity]) => (
        <span
          key={src}
          style={{
            position: "absolute",
            inset: 0,
            opacity,
            background: LOGO_CORAL,
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      ))}
    </span>
  );
}
