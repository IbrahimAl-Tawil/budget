import { builder } from "../builder";
import { requireUser, badRequest } from "../errors";
import { CategoryRef, MutationResultRef } from "../types/results";
import { prisma } from "@/lib/db/prisma";
import { okString, okColor, LIMITS } from "@/lib/validate";

builder.queryField("categories", (t) =>
  t.field({
    type: [CategoryRef],
    resolve: (_root, _args, ctx) =>
      prisma.category.findMany({
        where: { userId: requireUser(ctx) },
        orderBy: { name: "asc" },
      }),
  }),
);

const CategoryCreateInput = builder.inputType("CategoryCreateInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    icon: t.string(),
    color: t.string(),
  }),
});

builder.mutationField("createCategory", (t) =>
  t.field({
    type: MutationResultRef,
    args: { input: t.arg({ type: CategoryCreateInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireUser(ctx);
      if (!okString(input.name, LIMITS.NAME)) badRequest("Name is too long.");
      if (!okString(input.icon, LIMITS.NAME)) badRequest("Invalid icon.");
      if (!okColor(input.color)) badRequest("Invalid color.");
      if ((await prisma.category.count({ where: { userId } })) >= 200) {
        badRequest("Category limit reached.");
      }
      const category = await prisma.category.create({
        data: {
          userId,
          name: input.name,
          icon: input.icon || "circle",
          color: input.color || "oklch(68% 0.04 80)",
        },
      });
      return { ok: true, id: category.id };
    },
  }),
);
