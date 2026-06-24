import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { anthropic } from "@/lib/ai/client";
import { parsePdfStatement } from "@/lib/ai/parse-pdf";
import { DEFAULT_CATEGORIES, DEFAULT_BUDGET_SPLITS } from "@/lib/db/seed-categories";

/**
 * Best-effort repair of JSON that was truncated mid-array/object (e.g. when an
 * LLM hits its max_tokens limit). Walks back from the last byte to a safe
 * boundary and closes any open brackets so JSON.parse can succeed with a
 * partial result. Returns the original string if no repair is possible.
 */
function repairTruncatedJson(s: string): string {
  try {
    JSON.parse(s);
    return s;
  } catch {
    // proceed
  }

  for (let cut = s.length; cut > 0; cut--) {
    const ch = s[cut - 1];
    if (ch !== "," && ch !== "}" && ch !== "]") continue;

    let candidate = s.slice(0, ch === "," ? cut - 1 : cut);
    let braces = 0;
    let brackets = 0;
    let inStr = false;
    let escape = false;
    for (const c of candidate) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === "{") braces++;
      else if (c === "}") braces--;
      else if (c === "[") brackets++;
      else if (c === "]") brackets--;
    }
    if (inStr || braces < 0 || brackets < 0) continue;
    while (brackets-- > 0) candidate += "]";
    while (braces-- > 0) candidate += "}";

    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // try an earlier boundary
    }
  }
  return s;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += char;
    }
    result.push(current.trim());
    return result;
  });
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const currency = (formData.get("currency") as string) || "CAD";
    const monthlyIncome = Number(formData.get("monthlyIncome")) || 0;

    if (!files.length) {
      return Response.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Parse all files into raw transactions
    const allTransactions: { name: string; amount: number; date: string }[] = [];
    const fileInfos: { name: string; type: string }[] = [];

    for (const file of files) {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      fileInfos.push({ name: file.name, type: isPdf ? "pdf" : "csv" });

      if (isPdf) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const txs = await parsePdfStatement(base64);
        allTransactions.push(...txs);
      } else {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length < 2) continue;

        // Send headers + sample to Claude for column detection
        const headers = rows[0];
        const sample = rows.slice(1, 6);

        const colResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 256,
          system: `You parse CSV bank statements. Given headers and sample rows, identify which column indices contain the date, description, and amount. Respond ONLY with JSON: {"date": 0, "name": 1, "amount": 2}. Use 0-based indices.`,
          messages: [{
            role: "user",
            content: `Headers: ${JSON.stringify(headers)}\nSample rows: ${JSON.stringify(sample)}`,
          }],
        });

        const colText = colResponse.content[0].type === "text" ? colResponse.content[0].text : "";
        const colMatch = colText.match(/\{[\s\S]*?\}/);
        const cols = colMatch ? JSON.parse(colMatch[0]) : { date: 0, name: 1, amount: 2 };

        for (const row of rows.slice(1)) {
          const rawAmt = row[cols.amount]?.replace(/[$,]/g, "");
          const amount = parseFloat(rawAmt);
          if (isNaN(amount)) continue;
          allTransactions.push({
            date: row[cols.date] || new Date().toISOString().split("T")[0],
            name: row[cols.name] || "Unknown",
            amount,
          });
        }
      }
    }

    if (allTransactions.length === 0) {
      return Response.json({ error: "No transactions found in uploaded files" }, { status: 400 });
    }

    // Send everything to Claude for comprehensive analysis.
    // 4096 was truncating mid-transactions array (≈16k chars); 16k tokens
    // comfortably fits 200 categorized txs + accounts + recurring.
    const analysisResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 16384,
      system: `You are a financial analyst. Analyze these bank transactions to extract a complete financial profile. Return ONLY valid JSON with this structure:
{
  "accounts": [{"name": "Bank Name - Account Type", "type": "chequing|savings|credit-card|tfsa|rrsp|fhsa|investment|other", "balance": 0}],
  "recurringExpenses": [{"name": "Merchant", "amount": 99.99, "cycle": "Monthly|Annual|Weekly", "dueDay": 15}],
  "estimatedMonthlyIncome": 5000,
  "estimatedMonthlySpend": 3500,
  "transactions": [{"name": "Merchant", "amount": -42.50, "date": "2024-04-15", "category": "Groceries", "isRecurring": false}]
}

Rules for accounts:
- Infer the bank name and account type from transaction descriptions, headers, or file names
- If you can't determine the balance, set it to 0
- Common types: chequing, savings, credit-card, tfsa, rrsp, investment

Rules for recurring expenses:
- Look for transactions that appear multiple times with similar amounts
- Common recurring: rent, utilities, subscriptions (Netflix, Spotify, etc.), insurance, loan payments, phone bills
- Only include expenses you're confident are recurring
- dueDay: the day of the month the payment typically occurs (1-31), based on the transaction dates you see

Rules for transactions:
- Categorize into: Housing, Groceries, Dining Out, Transport, Subscriptions, Entertainment, Health, Bills, Income, Other
- Negative amounts = expenses, positive = income
- Clean up merchant names (remove reference numbers)

Rules for income:
- Look at deposits/credits to estimate monthly income
- If data spans multiple months, average it`,
      messages: [{
        role: "user",
        content: `File names: ${fileInfos.map(f => f.name).join(", ")}\n\nTransactions (${allTransactions.length} total):\n${JSON.stringify(allTransactions.slice(0, 200))}`,
      }],
    });

    const analysisText = analysisResponse.content[0].type === "text" ? analysisResponse.content[0].text : "";
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "Failed to analyze statements" }, { status: 500 });
    }

    type Analysis = {
      accounts: { name: string; type: string; balance: number }[];
      recurringExpenses: { name: string; amount: number; cycle: string; dueDay?: number }[];
      estimatedMonthlyIncome: number;
      estimatedMonthlySpend: number;
      transactions: { name: string; amount: number; date: string; category: string; isRecurring: boolean }[];
    };

    let analysis: Analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]) as Analysis;
    } catch (parseErr) {
      const repaired = repairTruncatedJson(jsonMatch[0]);
      try {
        analysis = JSON.parse(repaired) as Analysis;
        console.warn(
          `Auto onboarding: recovered truncated JSON (stop_reason=${analysisResponse.stop_reason}, ` +
          `original=${jsonMatch[0].length}b, repaired=${repaired.length}b)`,
        );
      } catch {
        console.error("Auto onboarding JSON parse failed:", parseErr, {
          stopReason: analysisResponse.stop_reason,
          length: jsonMatch[0].length,
          tail: jsonMatch[0].slice(-500),
        });
        return Response.json(
          { error: "Statement analysis returned malformed data. Try uploading fewer files at once." },
          { status: 502 },
        );
      }
    }

    // Use Claude's estimated income if user didn't provide one
    const finalIncome = monthlyIncome || analysis.estimatedMonthlyIncome || 0;
    const budgetTarget = analysis.estimatedMonthlySpend || Math.round(finalIncome * 0.7);

    return Response.json({
      analysis: {
        accounts: analysis.accounts || [],
        recurringExpenses: analysis.recurringExpenses || [],
        monthlyIncome: finalIncome,
        monthlySpend: analysis.estimatedMonthlySpend || 0,
        budgetTarget,
        transactions: analysis.transactions || [],
        fileCount: files.length,
        transactionCount: allTransactions.length,
      },
    });
  } catch (error) {
    console.error("Auto onboarding error:", error);
    return Response.json({ error: "Failed to process statements" }, { status: 500 });
  }
}
