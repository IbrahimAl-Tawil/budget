import { redirect } from "next/navigation";

// Subscriptions were folded into Spending as its "Recurring" section. Keep the
// old URL alive by redirecting so existing links/bookmarks still land somewhere.
export default function SubscriptionsPage() {
  redirect("/dashboard/spending");
}
