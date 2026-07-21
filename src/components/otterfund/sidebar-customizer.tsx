"use client";

// The "Customize sidebar" editor. A flat, drag-to-reorder list of every primary
// nav item with a per-row show/hide toggle. Reordering uses motion's Reorder
// (already the app's motion library) so it springs like the rest of the chrome;
// only the grip handle initiates a drag (dragListener=false + dragControls), so
// the row's toggle button and the list's own scroll never fight it.
//
// <SidebarEditor> is the pure list (reused inside the mobile sheet's dialog);
// <SidebarCustomizer> wraps it in the rail's Popover with a labelled header.

import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Eye, EyeOff, Pencil } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { NavItem } from "@/components/otterfund/nav-items";

function EditorRow({
  item,
  hidden,
  accent,
  onToggle,
}: {
  item: NavItem;
  hidden: boolean;
  accent: string;
  onToggle: (key: string) => void;
}) {
  const controls = useDragControls();
  const { Icon } = item;
  return (
    <Reorder.Item
      as="div"
      value={item.key}
      dragListener={false}
      dragControls={controls}
      className="of-reorder-row flex items-center gap-2.5 rounded-[13px] px-1.5 py-1.5"
      style={{ background: "var(--color-of-canvas)", border: "1px solid var(--color-of-line-soft)" }}
    >
      {/* grip — the only drag zone */}
      <button
        type="button"
        aria-label={`Reorder ${item.label}`}
        onPointerDown={(e) => controls.start(e)}
        className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-[var(--color-of-faint)] outline-none active:cursor-grabbing"
      >
        <GripVertical size={16} strokeWidth={1.9} aria-hidden="true" />
      </button>

      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]"
        style={{
          background: hidden ? "var(--color-of-surface)" : accent,
          color: hidden ? "var(--color-of-faint)" : "#fff",
          boxShadow: hidden ? "inset 0 0 0 1px var(--color-of-line-soft)" : "none",
        }}
      >
        <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <span
        className="min-w-0 flex-1 truncate text-[13.5px] font-semibold"
        style={{ color: hidden ? "var(--color-of-faint)" : "var(--color-of-ink)" }}
      >
        {item.label}
      </span>

      <button
        type="button"
        onClick={() => onToggle(item.key)}
        aria-pressed={!hidden}
        aria-label={hidden ? `Show ${item.label}` : `Hide ${item.label}`}
        title={hidden ? "Show" : "Hide"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-of-muted)] outline-none transition-colors hover:bg-[var(--color-of-line-soft)] hover:text-[var(--color-of-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
      >
        {hidden ? (
          <EyeOff size={15} strokeWidth={1.9} aria-hidden="true" />
        ) : (
          <Eye size={15} strokeWidth={1.9} aria-hidden="true" />
        )}
      </button>
    </Reorder.Item>
  );
}

export function SidebarEditor({
  items,
  hidden,
  accent,
  onReorder,
  onToggle,
}: {
  /** Full ordered list (hidden items included). */
  items: NavItem[];
  hidden: Set<string>;
  accent: string;
  onReorder: (keys: string[]) => void;
  onToggle: (key: string) => void;
}) {
  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={items.map((i) => i.key)}
      onReorder={onReorder}
      className="flex flex-col gap-1.5"
    >
      {items.map((item) => (
        <EditorRow
          key={item.key}
          item={item}
          hidden={hidden.has(item.key)}
          accent={accent}
          onToggle={onToggle}
        />
      ))}
    </Reorder.Group>
  );
}

/** Rail affordance: a small pencil button that opens the editor in a popover. */
export function SidebarCustomizer({
  items,
  hidden,
  accent,
  onReorder,
  onToggle,
}: {
  items: NavItem[];
  hidden: Set<string>;
  accent: string;
  onReorder: (keys: string[]) => void;
  onToggle: (key: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Customize sidebar"
        title="Customize sidebar"
        render={
          <button
            type="button"
            className="of-rail-btn flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-[11px] outline-none transition-[background,color] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
            style={{ color: "var(--color-of-rail-icon)" }}
          >
            <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        }
      />
      <PopoverContent side="right" align="end" sideOffset={12} className="w-[268px] p-3">
        <div className="px-1 pb-2">
          <div className="text-[13.5px] font-bold tracking-[-0.01em] text-[var(--color-of-ink)]">
            Customize sidebar
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--color-of-faint)]">
            Drag to reorder · tap the eye to hide
          </div>
        </div>
        <SidebarEditor items={items} hidden={hidden} accent={accent} onReorder={onReorder} onToggle={onToggle} />
      </PopoverContent>
    </Popover>
  );
}
