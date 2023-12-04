import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { Telegraf } from 'telegraf';
import { PgClient } from './postgres-client';
import { RedisClient } from './redis-client';
import { PLATFROMS, taskSchema, userSchema } from './schemas';
import { NewTask, NewUser } from './types';
import { CronJobs } from './cron-jobs';

const CREATE_TASKS_PATTERN = /^\/create-tasks( \"http(s)?:\/\/.+\"){1,}/gi;
const REGISTER_PATTERN = /^\/register$/gi;

const token = process.env.TOKEN || '';

const redisClient = RedisClient.getInstance();
const pgClient = PgClient.getInstance();

const bot = new Telegraf(token);
const cronJobs = new CronJobs(bot);

bot.use(async (ctx, next) => {
  const { text } = ctx.message as any;

  if (!text || REGISTER_PATTERN.test(text)) return await next();

  const { id: userId } = ctx.chat as any;

  if (!(await isExistedUser(userId, true)))
    return ctx.reply(
      'You have not registered yet. (Register by entering "/register")',
    );

  await redisClient.set(userId, true);

  return await next();
});

bot.hears(CREATE_TASKS_PATTERN, async (ctx) => {
  const { id } = ctx.from;
  const { text } = ctx.message as any;

  const links = text.trim().split(' ') as string[];
  links.shift();

  const newTasks: NewTask[] = [];

  for (let link of links) {
    if (!link) continue;
    link = link.replaceAll('"', '').trim();

    newTasks.push({
      userId: `${id}`,
      link,
    });
  }

  try {
    await pgClient.insert(taskSchema).values(newTasks);
    return ctx.reply(`You created ${newTasks.length} task(s).`);
  } catch (error: any) {
    console.log('User %s can not create tasks because of %s.', id, error.stack);

    return ctx.reply('You can not create tasks because server meets error.');
  }
});

bot.hears(REGISTER_PATTERN, async (ctx) => {
  const { id, first_name, last_name } = ctx.from;

  const newUser: NewUser = {
    id: `${id}`,
    fullName: `${first_name} ${last_name}`,
    platform: PLATFROMS.TELEGRAM,
  };

  try {
    if (await isExistedUser(newUser.id, true))
      return ctx.reply('You have already registered.');

    await pgClient.insert(userSchema).values(newUser);
    await redisClient.set(newUser.id, true);

    return ctx.reply('You registered successfully.');
  } catch (error: any) {
    console.log(
      'User %s can not register because of %s.',
      newUser.id,
      error.stack,
    );

    return ctx.reply('You can not register because server meets error.');
  }
});

bot.help((ctx) => {
  ctx.reply(
    'Sytax:\n' +
      '1. Register: /register' +
      '2. Create twitter profile: /create-twitter-profile "https://twitter.com/elonmusk"' +
      '3. Create tasks: /create-tasks "https://twitter.com/elonmusk/status/1730331223992472029" "https://twitter.com/Bybit_Official/status/1729498119937622275"',
  );
});

bot.launch();
cronJobs.start();

process.on('SIGINT', () => release('SIGINT'));
process.on('SIGTERM', () => release('SIGTERM'));

async function isExistedUser(
  userId: string,
  useCache: boolean = false,
): Promise<boolean> {
  if (useCache && (await redisClient.get(userId))) return true;

  const records = await pgClient
    .select()
    .from(userSchema)
    .where(eq(userSchema.id, userId));

  return !!records.length;
}

function release(reason: string = 'Unknown'): void {
  bot.stop(reason);
  cronJobs.release();
  redisClient.release();
}
