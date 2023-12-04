import { sql } from 'drizzle-orm';
import moment from 'moment';
import { ScheduledTask, schedule } from 'node-cron';
import { Telegraf } from 'telegraf';
import { PgClient } from '../postgres-client';
import { RedisClient } from '../redis-client';
import { taskSchema, userSchema } from '../schemas';

const pgClient = PgClient.getInstance();
const redisClient = RedisClient.getInstance();

export class CronJobs {
  private jobs: ScheduledTask[];

  constructor(private bot: Telegraf) {
    this.jobs = [];
  }

  public start(): void {
    this.jobs.push(
      schedule('00 */30 6-10 * * *', async () => {
        const key = `divided-tasks-in-${moment().format('DD-MM-YYYY')}`;

        if (await redisClient.get(key)) return;

        const users = await pgClient.select().from(userSchema);

        await Promise.all(
          users.map(async (user) => {
            const tasks = await pgClient
              .select()
              .from(taskSchema)
              .where(
                sql`${taskSchema.userId} <> ${user.id} AND DATE(${user.createdAt}) = CURRENT_DATE`,
              );

            let message: string;

            if (!tasks.length) {
              message = 'There are not any task(s) for you today.';
              return this.bot.telegram.sendMessage(
                Number.parseInt(user.id),
                message,
              );
            }

            message = 'Your tasks:\n';

            tasks.forEach(({ link }, index) => {
              message += ` ${index + 1}. ${link}\n`;
            });

            return this.bot.telegram.sendMessage(
              Number.parseInt(user.id),
              message,
            );
          }),
        );

        await redisClient.set(key, true, 12 * 60 * 60);
      }),
    );

    this.jobs.push(schedule('00 00 18 * * *', async () => {}));
  }

  public release(): void {
    this.jobs.forEach((job) => job.stop());
  }
}
