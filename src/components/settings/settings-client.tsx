"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, CardLabel } from "@/components/dashboard/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Save, Trash2, LogOut } from "lucide-react";

interface SettingsProps {
  user: {
    name: string;
    email: string;
    monthlyIncome: number;
    currency: string;
    budgetTarget: number;
  };
}

export function SettingsClient({ user }: SettingsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState(user.name);
  const [monthlyIncome, setMonthlyIncome] = useState(String(user.monthlyIncome));
  const [currency, setCurrency] = useState(user.currency);
  const [budgetTarget, setBudgetTarget] = useState(String(user.budgetTarget));

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          monthlyIncome: Number(monthlyIncome),
          currency,
          budgetTarget: Number(budgetTarget),
        }),
      });
      if (res.ok) {
        setSuccess("Settings saved!");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Something went wrong");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Profile */}
      <GlassCard className="hover:translate-y-0">
        <CardLabel>Profile</CardLabel>
        <div className="space-y-4 mt-3">
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
              Email
            </label>
            <Input
              value={user.email}
              disabled
              className="h-10 rounded-xl bg-neutral-50 border-black/[0.06] opacity-60"
            />
          </div>
        </div>
      </GlassCard>

      {/* Financial */}
      <GlassCard className="hover:translate-y-0">
        <CardLabel>Financial Settings</CardLabel>
        <div className="space-y-4 mt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
                Monthly Income
              </label>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
                Budget Target
              </label>
              <Input
                type="number"
                value={budgetTarget}
                onChange={(e) => setBudgetTarget(e.target.value)}
                className="h-10 rounded-xl bg-neutral-50 border-black/[0.06]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-neutral-400 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 rounded-xl bg-neutral-50 border border-black/[0.06] px-3 text-sm font-sans outline-none"
            >
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 h-11 rounded-xl bg-sage text-white font-semibold text-sm hover:opacity-90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
          className="h-11 rounded-xl border-black/[0.06] px-5 text-sm font-medium text-neutral-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {success && (
        <p className="text-sm text-sage font-medium text-center">{success}</p>
      )}
      {error && (
        <p className="text-sm text-terra font-medium text-center">{error}</p>
      )}

      {/* Danger Zone */}
      <GlassCard className="hover:translate-y-0 border-terra/20">
        <CardLabel>Danger Zone</CardLabel>
        <p className="text-sm text-neutral-400 mt-2 mb-4">
          Export your data or permanently delete your account.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/settings/export");
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "bulga-export.json";
                a.click();
              }
            }}
            className="h-9 rounded-xl border-black/[0.06] px-4 text-xs font-medium"
          >
            Export Data
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (confirm("Are you sure? This cannot be undone.")) {
                await fetch("/api/settings", { method: "DELETE" });
                signOut({ callbackUrl: "/login" });
              }
            }}
            className="h-9 rounded-xl px-4 text-xs font-medium"
          >
            <Trash2 className="w-3 h-3 mr-1.5" />
            Delete Account
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
