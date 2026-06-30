// Bulga form-field system.
//
// One pattern for every form across the app: a labelled field that renders an
// inline error beneath it and flags the control invalid. Build forms from
// <Field> + <TextInput> / <SelectInput> so spacing, focus, and error states
// are identical everywhere.

import { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const labelCls =
  "block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5";

// Controls use the shared `.bk-field` / `.bk-field-select` classes from
// globals.css — one source of truth for field styling across the app. When a
// field is invalid we override its border to clay.
const invalidBorder = "border-[var(--color-bk-clay)] focus:border-[var(--color-bk-clay)]";

interface FieldProps {
  label: string;
  /** Inline error message; when set, the field reads as invalid. */
  error?: string;
  hint?: string;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/** Labelled field wrapper with an inline error/hint row. */
export function Field({ label, error, hint, optional, htmlFor, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
        {optional && <span className="ml-1 normal-case tracking-normal text-[var(--color-bk-faint)] font-medium">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-[var(--color-bk-clay)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-[var(--color-bk-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}

type TextInputProps = React.ComponentProps<"input"> & { invalid?: boolean };

/** Text/number input sharing the system control styling + error state. */
export function TextInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn("bk-field", invalid && invalidBorder, className)}
      {...props}
    />
  );
}

/** Date input — the native picker chrome is themed to brand in globals.css. */
export function DateInput({ invalid, className, ...props }: TextInputProps) {
  return (
    <input
      type="date"
      aria-invalid={invalid || undefined}
      className={cn("bk-field bk-field-date", invalid && invalidBorder, className)}
      {...props}
    />
  );
}

/** Password input — same system control with an inline reveal/hide toggle. */
export function PasswordInput({ invalid, className, ...props }: TextInputProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <input
        type={revealed ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn("bk-field pr-11", invalid && invalidBorder, className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        aria-label={revealed ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-lg text-[var(--color-bk-muted)] transition-colors hover:text-[var(--color-bk-ink)] hover:bg-[var(--color-bk-line-soft)] outline-none focus-visible:text-[var(--color-bk-ink)]"
      >
        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

type SelectInputProps = React.ComponentProps<"select"> & { invalid?: boolean };

/** Select sharing the system control styling, with the brand chevron. */
export function SelectInput({ invalid, className, children, ...props }: SelectInputProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn("bk-field-select pr-10 cursor-pointer", invalid && invalidBorder, className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--color-bk-muted)]" />
    </div>
  );
}
