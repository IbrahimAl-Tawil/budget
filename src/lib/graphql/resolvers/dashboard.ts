import { builder } from "../builder";
import { requireUser } from "../errors";
import {
  DashboardOverviewRef,
  SpendCategoryRef,
  InsightRef,
} from "../types/views";
import {
  getDashboardOverview,
  getSpendingData,
  getInsights,
} from "@/lib/db/queries";

builder.queryField("overview", (t) =>
  t.field({
    type: DashboardOverviewRef,
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: (_root, args, ctx) =>
      getDashboardOverview(requireUser(ctx), args.month, args.year),
  }),
);

builder.queryField("spending", (t) =>
  t.field({
    type: [SpendCategoryRef],
    args: {
      month: t.arg.int({ required: true }),
      year: t.arg.int({ required: true }),
    },
    resolve: (_root, args, ctx) =>
      getSpendingData(requireUser(ctx), args.month, args.year),
  }),
);

builder.queryField("insights", (t) =>
  t.field({
    type: [InsightRef],
    resolve: (_root, _args, ctx) => getInsights(requireUser(ctx)),
  }),
);
