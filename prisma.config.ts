import "dotenv/config"; // Prisma 7 no longer auto-loads .env — load it so the CLI (migrate/studio) sees the URLs
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // The Prisma CLI (migrate/studio) uses the DIRECT connection (port 5432).
    // The app runtime connects through the pooled DATABASE_URL via the pg driver
    // adapter in src/lib/db/prisma.ts — Supabase's pgBouncer can't run migrations.
    url: env("DIRECT_URL"),
  },
});
