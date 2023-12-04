import 'dotenv/config';
import { ConsumeMessage } from 'amqplib';
import { eq, sql } from 'drizzle-orm';
import { ScheduledTask, schedule } from 'node-cron';
import { Telegraf } from 'telegraf';
import { PgClient } from './postgres-client';
import { RabbitConsumer, RabbitProducer } from './rabbitmq';
import { RedisClient } from './redis-client';
import { PLATFROMS, assignmentSchema, taskSchema, userSchema } from './schemas';
import { NewTask, NewUser } from './types';
import moment from 'moment';

// ============================== GLOBAL VARIABLES ==============================
const CREATE_TASKS_PATTERN =
  /^\/create-tasks( \"http(s)?:\/\/twitter\.com\/.+\"){1,}/gi;
const CREATE_TWITTER_PROFILE =
  /^\/create-twitter-profile \"http(s)?:\/\/twitter.com\/.+\"/gi;
const REGISTER_PATTERN = /^\/register$/gi;

const redisClient = RedisClient.getInstance();
const pgClient = PgClient.getInstance();
const cronJobs: ScheduledTask[] = [];

let bot: Telegraf;
let consumer: Consumer;
let producer: Producer;

// ============================== TELEGRAM BOT ==============================
const token = process.env.TOKEN || '';
bot = new Telegraf(token);

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
  const { id: userId } = ctx.from;
  const { text } = ctx.message as any;

  try {
    const users = await pgClient
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, `${userId}`));

    if (!users[0].twitterUserName) {
      return ctx.reply(
        'You must create twitter profile before creating tasks.',
      );
    }

    const links = text.trim().split(' ') as string[];
    links.shift();

    const newTasks: NewTask[] = [];

    for (let link of links) {
      if (!link) continue;
      link = link.replaceAll('"', '').trim();

      const taskId = link.split('/').pop();

      if (!taskId) {
        console.log('Can not find id from link "%s".', link);
        continue;
      }

      newTasks.push({
        id: taskId,
        userId: `${userId}`,
        link,
      });
    }

    await pgClient.insert(taskSchema).values(newTasks);

    return ctx.reply(
      `You created ${newTasks.length} task(s):\n${newTasks
        .map(({ link }, index) => ` ${index + 1}. ${link}`)
        .join('\n')}`,
    );
  } catch (error: any) {
    console.log(
      'User %s can not create tasks because of %s.',
      userId,
      error.stack,
    );

    return ctx.reply('You can not create tasks because server meets error.');
  }
});

bot.hears(CREATE_TWITTER_PROFILE, async (ctx) => {
  const { id: userId } = ctx.from;
  const { text } = ctx.message as any;

  const links = text.trim().split(' ') as string[];

  const twiiterUserName = links[links.length - 1].split('/').pop();

  if (!twiiterUserName) {
    return ctx.reply('Can not find twitter username from profile link.');
  }

  try {
    await pgClient.update(userSchema).set({
      twitterUserName: twiiterUserName,
    });

    return ctx.reply('You created twitter profile.');
  } catch (error: any) {
    console.log(
      'User %s can not create twitter profile because of %s.',
      userId,
      error.stack,
    );

    return ctx.reply(
      'You can not create twitter profile because server meets error.',
    );
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
      '1. Register: /register\n' +
      '2. Create twitter profile: /create-twitter-profile "https://twitter.com/elonmusk"\n' +
      '3. Create tasks: /create-tasks "https://twitter.com/elonmusk/status/1730331223992472029" "https://twitter.com/Bybit_Official/status/1729498119937622275"',
  );
});

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

// ============================== CONSUMER ==============================
class Consumer extends RabbitConsumer {
  public async handleMessage(data: any, msg: ConsumeMessage): Promise<void> {}
}

// ============================== PRODUCER ==============================
class Producer extends RabbitProducer {}

// ============================== CRON JOBS ==============================
cronJobs.push(
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

        return this.bot.telegram.sendMessage(Number.parseInt(user.id), message);
      }),
    );

    await redisClient.set(key, true, 12 * 60 * 60);
  }),
);

cronJobs.push(
  schedule('00 00 18 * * *', async () => {
    const results = await pgClient
      .select({
        userId: userSchema.id,
        taskId: taskSchema.id,
        link: taskSchema.link,
        twitterUserName: userSchema.twitterUserName,
      })
      .from(assignmentSchema)
      .where(
        sql`DATE(${assignmentSchema.createdAt}) = CURRENT_DATE AND is_handled NOT NULL`,
      )
      .innerJoin(taskSchema, eq(assignmentSchema.taskId, taskSchema.id))
      .innerJoin(userSchema, eq(assignmentSchema.userId, userSchema.id));

    await Promise.all(
      results.map(async (result) => {
        await producer.sendToQueue(result);
        return;
      }),
    );
  }),
);

// ============================== MAIN CONTEXT ==============================
async function release(reason: string = 'Unknown'): Promise<void> {
  bot.stop(reason);
  cronJobs.forEach((job) => job.stop());
  await consumer?.release();
  await producer?.release();
  await redisClient.release();
  process.exit(1);
}

async function start(): Promise<void> {
  const queue = 'tasks';

  consumer = new Consumer({
    queue,
    prefetch: 1,
  });

  producer = new Producer({
    queue,
  });

  await Promise.all([bot.launch(), consumer.connect(), producer.connect()]);
}

start().catch(async (error) => {
  console.log(error);
  await release();
});

process.on('SIGINT', () => release('SIGINT'));
process.on('SIGTERM', () => release('SIGTERM'));
