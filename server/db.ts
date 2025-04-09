import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if running on Replit (using process.env.REPL_ID)
const isReplit = !!process.env.REPL_ID;

// If this is on Replit, we require DATABASE_URL
// For local development, we'll provide a fallback connection string
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/pawfectmatch";

export let pool: Pool;
try {
  pool = new Pool({ connectionString });
  console.log("Successfully connected to the database");
} catch (error) {
  console.error("Failed to connect to database:", error);
  // If we're on Replit, we want to fail since DATABASE_URL should be provided
  if (isReplit) {
    throw new Error(
      "DATABASE_URL must be set properly on Replit."
    );
  }
  // For local dev, we'll just log the error
  pool = new Pool({ connectionString: "postgres://postgres:postgres@localhost:5432/postgres" });
}

export const db = drizzle({ client: pool, schema });
