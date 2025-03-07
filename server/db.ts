import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with connection timeout and retry logic
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
  max: 20 // Maximum number of clients the pool should contain
});

// Add error handler for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

export const db = drizzle({ client: pool, schema });
