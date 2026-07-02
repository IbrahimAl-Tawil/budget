"use client";

// Bulga mobile navigation — a premium bottom sheet that replaces the icon rail
// below the desktop breakpoint. Built on Base UI's Dialog (focus trap, backdrop,
// Escape, scroll-lock, portal). The trigger is an animated hamburger (three
// lines morph to an X); the sheet slides up from the bottom edge with a grab
// handle, rounded top, tinted icon tiles, a soft active state, and a staggered
// row reveal. Desktop keeps the icon rail — this whole control is display:none
// there (see .bk-hamburger / .bk-rail in globals.css).

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { Wordmark } from "@/components/bulga/logo";
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
  // Each row is a Dialog.Close rendering a Link, so a tap navigates and dismisses
  // in one gesture. --i drives the staggered entrance. Quiet by default: an
  // inline icon + label, no tile. The active row is the only emphasis — a soft
  // accent-tint pill with the icon + label in the accent tone.
  const row = (item: NavItem, i: number) => {
    const active = pathname === item.href;
    return (
      <Dialog.Close
        key={item.href}
        nativeButton={false}
        style={{ ["--i" as string]: String(i) }}
        render={
          <Link
            href={hrefFor(item.href)}
            aria-current={active ? "page" : undefined}
            className="bk-nav-row flex items-center gap-3.5 rounded-[13px] px-3.5 py-2.5 text-[15px] font-semibold no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
            style={
              active
                ? { background: "var(--accent)", color: "var(--color-primary)" }
                : { color: "var(--color-bk-ink)" }
            }
          >
            <item.Icon
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
              style={{ color: active ? "var(--color-primary)" : "var(--color-bk-muted)" }}
            />
            {item.label}
          </Link>
        }
      />
    );
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger
        className="bk-hamburger group relative grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] outline-none transition-colors hover:bg-[var(--color-bk-line-soft)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 data-popup-open:bg-[var(--bk-accent)]"
        aria-label="Menu"
      >
        <span className="bk-burger" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-[oklch(20%_0.02_80/0.34)] backdrop-blur-[2px] transition-opacity duration-300 data-closed:opacity-0 data-open:opacity-100" />
        <Dialog.Popup className="bk-sheet fixed inset-x-0 bottom-0 z-[61] mx-auto flex max-h-[86vh] w-full max-w-[520px] flex-col rounded-t-[28px] border border-b-0 border-[var(--color-bk-line)] bg-[var(--color-bk-surface)] pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-16px_60px_oklch(20%_0.02_80/0.22)] outline-none">
          {/* grab handle */}
          <div className="flex justify-center pt-3 pb-1">
            <span aria-hidden="true" className="h-1 w-9 rounded-full bg-[var(--color-bk-line)]" />
          </div>

          {/* header — wordmark */}
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <Wordmark />
          </div>

          {/* nav rows — scroll if a short screen can't fit them all */}
          <nav aria-label="Primary" className="bk-scroll flex-1 overflow-y-auto px-3">
            <div className="flex flex-col gap-1">
              {primary.map((item, i) => row(item, i))}
            </div>
            <div className="my-2.5 h-px bg-[var(--color-bk-line-soft)]" />
            <div className="flex flex-col gap-1">
              {secondary.map((item, i) => row(item, primary.length + i))}
            </div>
          </nav>

          {/* footer — account identity with a Settings action, then a
              destructive-tinted Log out row set apart below. */}
          <div className="mt-1 border-t border-[var(--color-bk-line-soft)] px-3 pt-3">
            <div className="flex items-center gap-3 rounded-[14px] px-2.5 py-2">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white"
                style={{ background: accent }}
                aria-hidden="true"
              >
                {initials ?? "?"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[var(--color-bk-ink)]">
                  {userName ?? "Your account"}
                </div>
                <div className="text-[11.5px] text-[var(--color-bk-faint)]">Free plan</div>
              </div>
              <Dialog.Close
                render={
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    aria-label="Settings"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-bk-muted)] outline-none transition-colors hover:bg-[var(--color-bk-line-soft)] hover:text-[var(--color-bk-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
                  >
                    <Settings size={17} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                }
              />
            </div>
            <Dialog.Close
              render={
                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-1 flex w-full items-center gap-3.5 rounded-[13px] px-3.5 py-2.5 text-[15px] font-semibold text-[var(--color-bk-clay)] outline-none transition-colors hover:bg-[var(--color-bk-clay-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-bk-clay)]/40"
                >
                  <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
                  Log out
                </button>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
