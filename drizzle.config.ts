import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schemas/index.ts',
  out: './src/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URI as string,
  },
} satisfies Config;
