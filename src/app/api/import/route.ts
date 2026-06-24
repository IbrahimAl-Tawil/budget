import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db/prisma";
import { parsePdfStatement } from "@/lib/ai/parse-pdf";

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });

  return { headers, rows };
}

export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileType = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "csv";

    // Create bank statement record
    const statement = await prisma.bankStatement.create({
      data: {
        userId: user.id,
        filename: file.name,
        fileType,
        status: "processing",
      },
    });

    if (fileType === "pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const transactions = await parsePdfStatement(base64);

      await prisma.bankStatement.update({
        where: { id: statement.id },
        data: { status: "done", txCount: transactions.length },
      });

      return Response.json({
        statementId: statement.id,
        fileType: "pdf",
        transactions,
      });
    }

    // CSV handling
    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    return Response.json({
      statementId: statement.id,
      fileType: "csv",
      headers,
      sampleRows: rows.slice(0, 5),
      totalRows: rows.length,
      allRows: rows,
    });
  } catch (error) {
    console.error("Import error:", error);
    return Response.json({ error: "Failed to process file" }, { status: 500 });
  }
}
