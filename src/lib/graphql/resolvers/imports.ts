import { builder } from "../builder";
import { requireUser, badRequest, notFound, rateLimited } from "../errors";
import { prisma } from "@/lib/db/prisma";
import { parsePdfStatement } from "@/lib/ai/parse-pdf";
import { categorizeTransactions } from "@/lib/ai/categorize";
import { rateLimit, MINUTE, HOUR } from "@/lib/rate-limit";
import { LIMITS, okString, okMoney } from "@/lib/validate";

// Minimal CSV parse (quote-aware) — matches the old /api/import handler.
function parseCsvTable(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else current += char;
    }
    result.push(current.trim());
    return result;
  };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

builder.mutationField("parseStatement", (t) =>
  t.field({
    type: "JSON",
    args: { file: t.arg({ type: "File", required: true }) },
    resolve: async (_root, { file }, ctx) => {
      const userId = requireUser(ctx);
      // Throttle the AI-cost path per user (best-effort; see rate-limit.ts note).
      const limit = rateLimit(`ai:parse:${userId}`, [
        { limit: 10, windowMs: 5 * MINUTE },
        { limit: 60, windowMs: HOUR },
      ]);
      if (!limit.ok) rateLimited(limit.retryAfterSec);
      // Cap size BEFORE buffering — file.size is populated by the multipart
      // parser before arrayBuffer()/text() reads the body.
      if (file.size > LIMITS.UPLOAD_BYTES) {
        badRequest("File too large (max 10 MB).");
      }
      const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv";

      const statement = await prisma.bankStatement.create({
        data: { userId, filename: file.name, fileType, status: "processing" },
      });

      if (fileType === "pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const transactions = await parsePdfStatement(buffer.toString("base64"));
        await prisma.bankStatement.update({
          where: { id: statement.id },
          data: { status: "done", txCount: transactions.length },
        });
        return { statementId: statement.id, fileType: "pdf", transactions };
      }

      const { headers, rows } = parseCsvTable(await file.text());
      return {
        statementId: statement.id,
        fileType: "csv",
        headers,
        sampleRows: rows.slice(0, 5),
        totalRows: rows.length,
        allRows: rows,
      };
    },
  }),
);

const ImportTransactionInput = builder.inputType("ImportTransactionInput", {
  fields: (t) => ({
    name: t.string({ required: true }),
    amount: t.float({ required: true }),
    date: t.string({ required: true }),
  }),
});

const ConfirmImportInput = builder.inputType("ConfirmImportInput", {
  fields: (t) => ({
    statementId: t.string(),
    accountId: t.id(),
    transactions: t.field({ type: [ImportTransactionInput], required: true }),
  }),
});

builder.mutationField("confirmImport", (t) =>
  t.field({
    type: "JSON",
    args: { input: t.arg({ type: ConfirmImportInput, required: true }) },
    resolve: async (_root, { input }, ctx) => {
      const userId = requireUser(ctx);
      if (!input.transactions.length) badRequest("No transactions to import.");
      if (input.transactions.length > LIMITS.IMPORT_TRANSACTIONS) {
        badRequest(`Too many transactions (max ${LIMITS.IMPORT_TRANSACTIONS}).`);
      }
      // Throttle the AI-cost path (categorization fans out one Claude call / 50 tx).
      const limit = rateLimit(`ai:import:${userId}`, [
        { limit: 10, windowMs: 5 * MINUTE },
        { limit: 60, windowMs: HOUR },
      ]);
      if (!limit.ok) rateLimited(limit.retryAfterSec);

      // Ownership: a client-supplied accountId/statementId must belong to the
      // caller. Without this, transactions could be booked against — and a
      // statement row mutated on — another user's records (RLS is disabled).
      if (input.accountId) {
        const acct = await prisma.account.findFirst({
          where: { id: input.accountId, userId },
        });
        if (!acct) notFound("Account not found.");
      }
      if (input.statementId) {
        const stmt = await prisma.bankStatement.findFirst({
          where: { id: input.statementId, userId },
        });
        if (!stmt) notFound("Statement not found.");
      }

      // Clamp each row (client-supplied, and about to be fed to the AI + written).
      for (const tx of input.transactions) {
        if (!okString(tx.name, LIMITS.NAME)) badRequest("A transaction name is too long.");
        if (!okMoney(tx.amount)) badRequest("A transaction amount is out of range.");
      }

      const categories = await prisma.category.findMany({ where: { userId } });
      const categorized = await categorizeTransactions(
        input.transactions.map((tx) => ({
          name: tx.name,
          amount: tx.amount,
          date: tx.date,
        })),
        categories.map((c) => c.name),
      );
      const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

      // Account balance is computed live from transactions, so no balance write.
      const created = await Promise.all(
        categorized.map((tx) =>
          prisma.transaction.create({
            data: {
              userId,
              name: tx.name,
              amount: tx.amount,
              date: new Date(tx.date),
              categoryId: categoryMap.get(tx.category) || undefined,
              accountId: input.accountId || undefined,
              icon: tx.icon,
              color: tx.color,
              isRecurring: tx.isRecurring,
              recurringFlag: tx.isRecurring ? "suggested" : undefined,
              source: "csv",
              statementId: input.statementId || undefined,
            },
          }),
        ),
      );

      if (input.statementId) {
        // Scoped by userId (ownership already checked above) so a foreign
        // statement id can never be mutated even if the guard is ever removed.
        await prisma.bankStatement.updateMany({
          where: { id: input.statementId, userId },
          data: { status: "done", txCount: created.length },
        });
      }

      return {
        imported: created.length,
        categorized: categorized.map((tx) => ({
          name: tx.name,
          amount: tx.amount,
          category: tx.category,
          isRecurring: tx.isRecurring,
        })),
      };
    },
  }),
);
