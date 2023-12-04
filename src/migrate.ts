import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { PgClient } from './postgres-client';

(async () => {
  await migrate(PgClient.getInstance(), { migrationsFolder: 'src/migrations' });
  console.log('Migrate successfully !');
})();
