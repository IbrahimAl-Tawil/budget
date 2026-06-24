import { anthropic } from "./client";

interface TransactionSummary {
  name: string;
  amount: number;
  date: string;
  id: string;
}

export interface RecurringSuggestion {
  merchantName: string;
  amount: number;
  frequency: string;
  confidence: number;
  transactionIds: string[];
}

export async function detectRecurringExpenses(
  transactions: TransactionSummary[]
): Promise<RecurringSuggestion[]> {
  if (transactions.length < 5) return [];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: `You are a financial analyst. Analyze the transaction history to identify recurring expenses.

Look for patterns:
- Same or very similar merchant names
- Similar amounts (within 10% variance)
- Regular intervals (weekly, monthly, quarterly, annual)

Respond with ONLY a valid JSON array:
[{
  "merchantName": "Netflix",
  "amount": 22.99,
  "frequency": "Monthly",
  "confidence": 0.95,
  "transactionIds": ["id1", "id2", "id3"]
}, ...]

Only include patterns where you have high confidence (>0.7). The frequency should be one of: "Weekly", "Monthly", "Quarterly", "Annual".`,
    messages: [
      {
        role: "user",
        content: `Analyze these transactions for recurring patterns:\n${JSON.stringify(transactions)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as RecurringSuggestion[];
  } catch {
    return [];
  }
}
