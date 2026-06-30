"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { GoalView } from "@/lib/types";

interface EditGoalModalProps {
  open: boolean;
  goal: GoalView | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditGoalModal({
  open,
  goal,
  onClose,
  onUpdated,
}: EditGoalModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (goal && open) {
      setName(goal.name);
      setEmoji(goal.emoji || "");
      setTarget(String(goal.target));
      setSaved(String(goal.saved));
      setDeadline(goal.deadlineISO || "");
      setPriority(goal.priority ? String(goal.priority) : "");
      setError("");
      setConfirmDelete(false);
    }
  }, [goal, open]);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleSave = () => {
    if (!goal) return;
    if (!name || !target) {
      setError("Name and target are required");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goals/${goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            emoji: emoji || null,
            target: Number(target),
            saved: Number(saved) || 0,
            priority: priority === "" ? 0 : Number(priority),
            deadline: deadline || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to update goal");
          return;
        }
        onClose();
        onUpdated();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  const handleDelete = () => {
    if (!goal) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/goals/${goal.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setError("Failed to delete");
          return;
        }
        onClose();
        onUpdated();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">Edit Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-3">
            <div className="w-16">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Emoji</label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎯"
                className="w-full px-3 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-lg text-center text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Goal Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vacation Fund"
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Target Amount</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Already Saved</label>
              <input
                type="number"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Priority Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0 = equal split"
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-text tracking-[0.06em] uppercase mb-2">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(28%_0.012_260/0.14)] bg-[oklch(100%_0_0/0.55)] font-sans text-sm text-bulga-text placeholder:text-muted-text outline-none transition-colors focus:border-sage focus:bg-[oklch(100%_0_0/0.7)]"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-terra font-medium mt-2">{error}</p>}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={confirmDelete ? "Confirm delete goal" : "Delete goal"}
            aria-pressed={confirmDelete}
            className={`h-11 rounded-xl flex items-center justify-center shrink-0 min-w-0 cursor-pointer text-sm font-semibold text-white transition-[width,padding,gap,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-50 ${
              confirmDelete
                ? "w-[148px] gap-1.5 px-3 bg-terra hover:bg-[oklch(58%_0.12_38)]"
                : "w-11 gap-0 px-0 bg-[oklch(60%_0.16_25)] hover:bg-terra"
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden text-[13px] font-semibold transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                confirmDelete ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              {isPending ? "Deleting…" : "Are you sure?"}
            </span>
          </button>
          <Button
            onClick={handleSave}
            disabled={isPending || confirmDelete}
            className="ml-auto h-11 px-6 rounded-xl bg-bulga-text text-white font-sans text-sm font-semibold hover:opacity-85 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
