import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection - disable prepare for PgBouncer/Supabase Pooler on 6543
const client = postgres(process.env.DATABASE_URL, { prepare: false });

// Create the drizzle instance
export const db = drizzle(client, { schema });

export type DB = typeof db;