"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AddGoalModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name || !target) {
      setError("Name and target are required");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            emoji: emoji || undefined,
            target: Number(target),
            saved: Number(saved) || 0,
            priority: priority === "" ? 0 : Number(priority),
            deadline: deadline || undefined,
          }),
        });
        if (!res.ok) {
          setError("Failed to create goal");
          return;
        }
        setName("");
        setEmoji("");
        setTarget("");
        setSaved("");
        setDeadline("");
        setPriority("");
        onAdded();
      } catch {
        setError("Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[oklch(100%_0_0/0.62)] backdrop-blur-[40px] backdrop-saturate-[2] border border-[oklch(100%_0_0/0.6)] rounded-3xl p-8 max-w-[420px] shadow-[0_2px_0_oklch(100%_0_0/0.8)_inset,0_32px_80px_oklch(16%_0.02_260/0.2),0_4px_16px_oklch(16%_0.02_260/0.08)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-[-0.02em]">New Goal</DialogTitle>
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
        <div className="flex gap-2.5 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 py-3 rounded-xl border-[1.5px] border-bulga-border bg-transparent text-sm font-medium text-muted-text">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="flex-[2] py-3 rounded-xl bg-sage text-white text-sm font-semibold hover:opacity-85">
            {isPending ? "Creating..." : "Create Goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
