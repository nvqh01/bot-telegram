import 'dotenv/config';
import { eq, ne, sql } from 'drizzle-orm';
import TelegramBot from 'node-telegram-bot-api';
import { schedule } from 'node-cron';
import { db } from './postgres-client';
import { taskSchema, userSchema } from './schemas';
import { Task, NewTask, User, NewUser } from './types';

const token = process.env.TOKEN || '';

const bot = new TelegramBot(token, { polling: true });

let isDividedTasks: boolean = false;

// schedule(
//   '00 00 06 * * *',
//   async () => {
//     if (isDividedTasks) return;

//     const users = await db.select().from(userSchema);

//     await Promise.all(
//       users.map(async (user) => {
//         const tasks = await db
//           .select()
//           .from(taskSchema)
//           .where(
//             sql`${taskSchema.userId} <> ${user.id} AND DATE(${user.createdAt}) = CURRENT_DATE`,
//           );

//         let message: string;

//         if (!tasks.length) {
//           message = 'There are not any task(s) for you today.';
//           sendMessage(Number.parseInt(user.id), message);
//         }

//         message = 'Your tasks:\n';

//         tasks.forEach(({ link }, index) => {
//           message += `${index}. ${link}\n`;
//         });

//         sendMessage(Number.parseInt(user.id), message);
//       }),
//     );

//     isDividedTasks = true;
//   },
//   { name: 'Divide tasks' },
// );

// schedule(
//   '00 00 18 * * *',
//   async () => {
//     isDividedTasks = false;
//   },
//   { name: 'Check tasks' },
// );

function sendMessage(chatId: number, message: string) {
  bot.sendMessage(chatId, message);
}

// bot.onText(/^\/create-tasks: \[(\"http(s)?:\/\/.+\"){1,}\]$/gi, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = msg.from;

//   let message: string;

//   if (!user?.id) {
//     message = 'You does not have id.';
//     return sendMessage(chatId, message);
//   }

//   try {
//     const existedUser = await db
//       .select()
//       .from(userSchema)
//       .where(eq(userSchema.id, `${user.id}`));

//     if (!existedUser.length) {
//       message = 'You must register by entering "/register".';
//       return sendMessage(chatId, message);
//     }

//     let text = msg.text;
//     text = text?.replace('links:', '')?.trim();

//     if (!text) {
//       message = 'Can not get task(s) from your command.';
//       return sendMessage(chatId, message);
//     }

//     const links = JSON.parse(text) as string[];

//     const newTasks: NewTask[] = links.map<NewTask>((link) => {
//       return {
//         link,
//         userId: `${user.id}`,
//       };
//     });

//     await db.insert(taskSchema).values(newTasks);

//     message = `You created ${newTasks.length} task(s).`;
//     return sendMessage(chatId, message);
//   } catch (error: any) {
//     console.log(
//       'User %s can not create task(s) because of %s.',
//       user.id,
//       error.stack,
//     );

//     message = 'Fail to create task(s).';
//     return sendMessage(chatId, message);
//   }
// });

// bot.onText(/^\/register$/gi, async (msg) => {
//   const chatId = msg.chat.id;
//   const user = msg.from;

//   let message: string;

//   if (!user?.id) {
//     message = 'You does not have id.';
//     return sendMessage(chatId, message);
//   }

//   const newUser: NewUser = {
//     id: `${user.id}`,
//     fullName: `${user?.first_name} ${user?.last_name}`,
//   };

//   try {
//     const existedUser = await db
//       .select()
//       .from(userSchema)
//       .where(eq(userSchema.id, newUser.id));

//     if (existedUser.length) {
//       message = 'You have already registered.';
//       return sendMessage(chatId, message);
//     }

//     await db.insert(userSchema).values(newUser);
//     message = 'Register successfully.';
//     return sendMessage(chatId, message);
//   } catch (error: any) {
//     console.log(
//       'User %s can not register because of %s.',
//       newUser.id,
//       error.stack,
//     );

//     message = 'Can not register.';
//     return sendMessage(chatId, message);
//   }
// });

bot.on('polling_error', async (error) => {
  console.log(error.stack);
  console.log('Check');

  // const isLogOut = await bot.logOut();
  // console.log(isLogOut ? 'Logout successfully !' : 'Fail to logout !');

  process.exit(1);
});

bot.on('message', (msg) => {
  bot.sendMessage(msg.chat.id, 'What is your name ?', {
    reply_to_message_id: msg.message_id,
  });

  // bot.onReplyToMessage(msg.chat.id, msg.message_id, (msg) => {
  //   bot.sendMessage(msg.chat.id, `Hi, ${msg?.text || 'Unknown'}`);
  // });
});

// bot.on('callback_query', (callbackQuery) => {
//   console.log('Id: ' + callbackQuery.id);
//   console.log('Message: ' + callbackQuery.message);

//   bot.answerCallbackQuery(callbackQuery.id, {
//     text: 'Hehehehe',
//   });
// });

process.on('SIGINT', async () => {
  const isLogOut = await bot.logOut();
  console.log(isLogOut ? 'Logout successfully !' : 'Fail to logout !');
});
