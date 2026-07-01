import { builder } from "../builder";
import { requireUser, notFound, badRequest } from "../errors";
import { SubscriptionRef } from "../types/views";
import { MutationResultRef } from "../types/results";
import { getSubscriptions } from "@/lib/db/queries";
import { prisma } from "@/lib/db/prisma";
import { okMoney } from "@/lib/validate";

builder.queryField("subscriptions", (t) =>
  t.field({
    type: [SubscriptionRef],
    resolve: (_root, _args, ctx) => getSubscriptions(requireUser(ctx)),
  }),
);

builder.mutationField("updateSubscription", (t) =>
  t.field({
    type: MutationResultRef,
    args: {
      id: t.arg.id({ required: true }),
      categoryId: t.arg.id(),
      amount: t.arg.float(),
    },
    resolve: async (_root, { id, categoryId, amount }, ctx) => {
      const userId = requireUser(ctx);
      if (!okMoney(amount)) badRequest("Amount is out of range.");
      const existing = await prisma.subscription.findFirst({
        where: { id, userId },
      });
      if (!existing) notFound();

      // A client-supplied categoryId must belong to the caller (BOLA guard):
      // otherwise the joined categoryName would leak another user's category.
      if (categoryId) {
        const cat = await prisma.category.findFirst({
          where: { id: categoryId, userId },
        });
        if (!cat) notFound("Category not found.");
      }

      const data: {
        categoryId?: string | null;
        amount?: number;
        previousAmount?: number;
      } = {};
      if (categoryId !== undefined) data.categoryId = categoryId || null;
      if (amount != null && Number.isFinite(amount) && amount !== existing.amount) {
        // Stash the prior amount so the price-change detector can flag the diff.
        data.previousAmount = existing.amount;
        data.amount = amount;
      }

      if (Object.keys(data).length > 0) {
        await prisma.subscription.update({ where: { id }, data });
      }
      return { ok: true, id };
    },
  }),
);
