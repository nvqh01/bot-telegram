import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

const postgresUri = process.env.POSTGRES_URI;

export class PgClient {
  static instance: PgClient;

  private db: ReturnType<typeof drizzle>;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: postgresUri,
    });

    this.db = drizzle(this.pool, { schema });
  }

  static getInstance(): ReturnType<typeof drizzle> {
    if (!PgClient.instance) PgClient.instance = new PgClient();
    return PgClient.instance.db;
  }
}
