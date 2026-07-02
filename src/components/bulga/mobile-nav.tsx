"use client";

// Bulga mobile navigation — a modern dropdown that drops from the topbar
// hamburger, replacing the icon rail below the desktop breakpoint. Built on
// Base UI's Popover so it gets a focus trap, backdrop, Escape-to-close,
// scroll-lock, portal and collision-aware positioning for free. The trigger is
// an animated hamburger (lines morph to an X on open); the panel scale-fades
// down with a staggered row reveal. Desktop keeps the icon rail — this whole
// control is display:none there (see .bk-hamburger / .bk-rail in globals.css).

import { Popover } from "@base-ui/react/popover";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export function MobileNav({
  primary,
  secondary,
  pathname,
  hrefFor,
  accent,
  userName,
  initials,
  onOpenSettings,
  onSignOut,
}: {
  primary: NavItem[];
  secondary: NavItem[];
  pathname: string;
  hrefFor: (href: string) => string;
  accent: string;
  userName: string | null;
  initials: string | null;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const items = [...primary, ...secondary];

  const row = (item: NavItem, i: number) => {
    const active = pathname === item.href;
    return (
      <Popover.Close
        key={item.href}
        // Each row is a Popover.Close rendering a Link (an <a>, not a <button>),
        // so a tap navigates and dismisses in one gesture. nativeButton={false}
        // tells Base UI the rendered element isn't a native button. --i drives
        // the staggered entrance.
        nativeButton={false}
        style={{ ["--i" as string]: String(i) }}
        render={
          <Link
            href={hrefFor(item.href)}
            aria-current={active ? "page" : undefined}
            className="bk-nav-row flex items-center gap-3.5 rounded-[14px] px-3.5 py-3 text-[15px] font-semibold no-underline outline-none transition-[background,color] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
            style={active ? { background: accent, color: "#fff" } : { color: "var(--color-bk-ink)" }}
          >
            <item.Icon size={19} strokeWidth={1.9} aria-hidden="true" />
            {item.label}
          </Link>
        }
      />
    );
  };

  return (
    <Popover.Root>
      <Popover.Trigger
        className="bk-hamburger group relative grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] outline-none transition-colors hover:bg-[var(--color-bk-line-soft)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 data-popup-open:bg-[var(--bk-accent)]"
        aria-label="Menu"
      >
        {/* three lines that morph to an X when the popover is open */}
        <span className="bk-burger" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Backdrop className="fixed inset-0 z-[60] bg-[oklch(20%_0.02_80/0.28)] backdrop-blur-[2px] transition-opacity duration-200 data-closed:opacity-0 data-open:opacity-100" />
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className="z-[61]"
        >
          <Popover.Popup className="bk-nav-panel w-[min(300px,calc(100vw-24px))] origin-[var(--transform-origin)] overflow-hidden rounded-[20px] border border-[var(--color-bk-line)] bg-[var(--color-bk-surface)] p-2 shadow-[0_24px_64px_oklch(20%_0.02_80/0.22),0_2px_8px_oklch(20%_0.02_80/0.06)] outline-none">
            <div className="flex flex-col gap-0.5 px-1 pt-1">
              {primary.map((item, i) => row(item, i))}
            </div>

            <div className="my-2 h-px bg-[var(--color-bk-line-soft)]" />

            <div className="flex flex-col gap-0.5 px-1">
              {secondary.map((item, i) => row(item, primary.length + i))}
            </div>

            <div className="my-2 h-px bg-[var(--color-bk-line-soft)]" />

            {/* account footer */}
            <div className="flex items-center gap-3 px-3.5 py-2">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11.5px] font-bold text-white"
                style={{ background: "var(--bk-accent)" }}
                aria-hidden="true"
              >
                {initials ?? "?"}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--color-bk-ink)]">
                  {userName ?? "Your account"}
                </div>
                <div className="text-[11px] text-[var(--color-bk-faint)]">Free plan</div>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 px-1 pb-1">
              <Popover.Close
                render={
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="bk-nav-row flex w-full items-center gap-3.5 rounded-[14px] px-3.5 py-2.5 text-[14px] font-semibold text-[var(--color-bk-ink)] outline-none"
                  >
                    <Settings size={17} strokeWidth={2} aria-hidden="true" />
                    Settings
                  </button>
                }
              />
              <Popover.Close
                render={
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="bk-nav-row flex w-full items-center gap-3.5 rounded-[14px] px-3.5 py-2.5 text-[14px] font-semibold text-[var(--color-bk-ink)] outline-none"
                  >
                    <LogOut size={17} strokeWidth={2} aria-hidden="true" />
                    Log out
                  </button>
                }
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
