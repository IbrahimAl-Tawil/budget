import { builder } from "../builder";
import { requireUser, badRequest, rateLimited } from "../errors";
import { MutationResultRef } from "../types/results";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { okString, okMoney, okEnum, LIMITS } from "@/lib/validate";
import { CURRENCIES } from "@/lib/constants";
import { logSecurityEvent } from "@/lib/log";
import { rateLimit, MINUTE, HOUR } from "@/lib/rate-limit";

const SettingsUpdateInput = builder.inputType("SettingsUpdateInput", {
  fields: (t) => ({
    name: t.string(),
    monthlyIncome: t.float(),
    currency: t.string(),
    budgetTarget: t.float(),
    accent: t.string(),
  }),
});

builder.mutationField("updateSettings", (t) =>
  t.field({
    type: MutationResultRef,
    args: { input: t.arg({ type: SettingsUpdateInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireUser(ctx);
      if (!okString(input.name, LIMITS.NAME)) badRequest("Name is too long.");
      if (!okString(input.accent, 80)) badRequest("Invalid accent.");
      if (!okEnum(input.currency, CURRENCIES)) badRequest("Unsupported currency.");
      if (!okMoney(input.monthlyIncome) || (input.monthlyIncome != null && input.monthlyIncome < 0)) {
        badRequest("Monthly income is out of range.");
      }
      if (!okMoney(input.budgetTarget) || (input.budgetTarget != null && input.budgetTarget < 0)) {
        badRequest("Budget target is out of range.");
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name != null && { name: input.name }),
          ...(input.monthlyIncome != null && { monthlyIncome: input.monthlyIncome }),
          ...(input.currency != null && { currency: input.currency }),
          ...(input.budgetTarget != null && { budgetTarget: input.budgetTarget }),
          ...(input.accent !== undefined && { accent: input.accent }),
        },
      });
      return { ok: true, id: userId };
    },
  }),
);

builder.mutationField("deleteMyAccount", (t) =>
  t.field({
    type: MutationResultRef,
    resolve: async (_root, _args, ctx) => {
      const userId = requireUser(ctx);
      // Throttle this irreversible, cascading action (also blunts double-submits).
      const limit = rateLimit(`account:delete:${userId}`, [
        { limit: 3, windowMs: MINUTE },
        { limit: 5, windowMs: HOUR },
      ]);
      if (!limit.ok) rateLimited(limit.retryAfterSec);
      // Delete the profile row (cascades all data), then the Supabase auth user.
      await prisma.user.delete({ where: { id: userId } });
      await createAdminClient().auth.admin.deleteUser(userId);
      logSecurityEvent("account.deleted", { userId });
      return { ok: true, id: userId };
    },
  }),
);
