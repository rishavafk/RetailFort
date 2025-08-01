import { defineConfig } from "drizzle-kit";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_DB_PASSWORD) {
  throw new Error("SUPABASE_URL and SUPABASE_DB_PASSWORD must be set");
}

const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@${process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
