import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://medikiosk:medikiosk@127.0.0.1:5432/medikiosk'
  },
  strict: true,
  verbose: true
});
