"use client";

import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-card-hover relative overflow-hidden rounded-[22px] p-6 sm:p-8 " +
          "bg-[oklch(100%_0_0/0.38)] backdrop-blur-[32px] backdrop-saturate-[1.8] " +
          "border border-[oklch(100%_0_0/0.6)] " +
          "[border-bottom-color:oklch(100%_0_0/0.25)] [border-right-color:oklch(100%_0_0/0.25)] " +
          "shadow-[0_2px_0_oklch(100%_0_0/0.7)_inset,0_8px_32px_oklch(16%_0.02_260/0.1),0_2px_8px_oklch(16%_0.02_260/0.07)] " +
          "transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-3">
      {children}
    </div>
  );
}

export function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-serif text-[26px] sm:text-[32px] tracking-[-0.03em] leading-none", className)}>
      {children}
    </div>
  );
}
