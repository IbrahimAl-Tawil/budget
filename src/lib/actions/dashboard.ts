"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getDashboardOverview,
  getSpendingData,
  getGoals,
  getTransactions,
  getSubscriptions,
  getAccounts,
  getInsights,
} from "@/lib/db/queries";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function fetchOverview(month: number, year: number) {
  const userId = await getUserId();
  return getDashboardOverview(userId, month, year);
}

export async function fetchSpending(month: number, year: number) {
  const userId = await getUserId();
  return getSpendingData(userId, month, year);
}

export async function fetchGoals() {
  const userId = await getUserId();
  return getGoals(userId);
}

export async function fetchTransactions(options: {
  page?: number;
  search?: string;
  month?: number;
  year?: number;
}) {
  const userId = await getUserId();
  return getTransactions(userId, options);
}

export async function fetchSubscriptions() {
  const userId = await getUserId();
  return getSubscriptions(userId);
}

export async function fetchAccounts() {
  const userId = await getUserId();
  return getAccounts(userId);
}

export async function fetchInsights() {
  const userId = await getUserId();
  return getInsights(userId);
}
