"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/dashboard/primitives/glass-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Save, Trash2, LogOut } from "lucide-react";
import { CURRENCIES } from "@/lib/constants";

interface SettingsProps {
  user: {
    name: string;
    email: string;
    monthlyIncome: number;
    currency: string;
    budgetTarget: number;
  };
}

const sectionHeadingCls = "font-serif text-[22px] sm:text-[26px] tracking-[-0.02em]";
const fieldLabelCls = "block text-[11px] font-semibold tracking-[0.09em] uppercase text-muted-text mb-1.5";
const fieldInputCls = "h-10 rounded-xl bg-white/70 border-[oklch(90%_0.006_80)]";

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
    <div className="flex flex-col gap-10 sm:gap-14 w-full">
      {/* Profile */}
      <GlassCard className="hover:translate-y-0">
        <div className={sectionHeadingCls}>Profile</div>
        <div className="space-y-5 mt-5">
          <div>
            <label className={fieldLabelCls}>Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldInputCls}
            />
          </div>
          <div>
            <label className={fieldLabelCls}>Email</label>
            <Input
              value={user.email}
              disabled
              className={`${fieldInputCls} opacity-60`}
            />
          </div>
        </div>
      </GlassCard>

      {/* Financial */}
      <GlassCard className="hover:translate-y-0">
        <div className={sectionHeadingCls}>Financial Settings</div>
        <div className="space-y-5 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className={fieldLabelCls}>Monthly Income</label>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className={fieldInputCls}
              />
            </div>
            <div>
              <label className={fieldLabelCls}>Budget Target</label>
              <Input
                type="number"
                value={budgetTarget}
                onChange={(e) => setBudgetTarget(e.target.value)}
                className={fieldInputCls}
              />
            </div>
          </div>
          <div>
            <label className={fieldLabelCls}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/70 border border-[oklch(90%_0.006_80)] px-3 text-sm font-sans outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex flex-col gap-3">
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
            className="h-11 rounded-xl border-[oklch(90%_0.006_80)] px-5 text-sm font-medium text-muted-text"
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
      </div>

      {/* Danger Zone */}
      <GlassCard className="hover:translate-y-0 border-terra/20">
        <div className={sectionHeadingCls}>Danger Zone</div>
        <p className="text-sm text-muted-text mt-2 mb-4">
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
            className="h-9 rounded-xl border-[oklch(90%_0.006_80)] px-4 text-xs font-medium"
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
