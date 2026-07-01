"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/bulga/emoji-picker";
import { Trash2 } from "lucide-react";
import type { GoalView } from "@/lib/types";
import { gqlClient, errMessage } from "@/lib/graphql/client";

const UPDATE_GOAL = /* GraphQL */ `
  mutation UpdateGoal($id: ID!, $input: GoalUpdateInput!) {
    updateGoal(id: $id, input: $input) { ok }
  }
`;

const DELETE_GOAL = /* GraphQL */ `
  mutation DeleteGoal($id: ID!) {
    deleteGoal(id: $id) { ok }
  }
`;

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
        await gqlClient.request(UPDATE_GOAL, {
          id: goal.id,
          input: {
            name,
            emoji: emoji || null,
            target: Number(target),
            saved: Number(saved) || 0,
            priority: priority === "" ? 0 : Number(priority),
            deadline: deadline || null,
          },
        });
        onClose();
        onUpdated();
      } catch (e) {
        setError(errMessage(e));
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
        await gqlClient.request(DELETE_GOAL, { id: goal.id });
        onClose();
        onUpdated();
      } catch {
        setError("Failed to delete");
      }
    });
  };

  if (!goal) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] p-9">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-[-0.02em] text-[var(--color-bk-ink)]">Edit Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-3">
            <div className="w-16">
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5">Goal Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vacation Fund"
                className="bk-field"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5">Target Amount</label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="10000"
                className="bk-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5">Already Saved</label>
              <input
                type="number"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                placeholder="0"
                className="bk-field"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5">Priority Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="0 = equal split"
                className="bk-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-[var(--color-bk-faint)] mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bk-field bk-field-date"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-[var(--color-bk-clay)] font-medium mt-2">{error}</p>}
        <div className="flex items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={confirmDelete ? "Confirm delete goal" : "Delete goal"}
            aria-pressed={confirmDelete}
            className={`h-11 rounded-full flex items-center justify-center shrink-0 min-w-0 cursor-pointer text-sm font-semibold text-white transition-[width,padding,gap,background-color] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] disabled:opacity-50 ${
              confirmDelete
                ? "w-[148px] gap-1.5 px-3 bg-[var(--color-bk-clay)] hover:opacity-90"
                : "w-11 gap-0 px-0 bg-[var(--color-bk-clay)] hover:opacity-90"
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
            className="ml-auto h-11 px-6 rounded-full bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
