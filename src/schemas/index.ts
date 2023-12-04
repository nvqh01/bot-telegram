import {
  bigint,
  bigserial,
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export enum PLATFROMS {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

export const platformEnum = pgEnum('platform', ['discord', 'telegram']);

export const taskSchema = pgTable(
  'tasks',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    userId: varchar('user_id', { length: 50 })
      .notNull()
      .references(() => userSchema.id),
    link: varchar('link', { length: 1024 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      taskUserIdIdx: index('task_user_id_idx').on(table.userId),
    };
  },
);

export const userSchema = pgTable(
  'users',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    fullName: varchar('full_name', { length: 256 }).notNull(),
    platform: platformEnum('platform').notNull(),
    point: bigint('point', { mode: 'number' }).default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    twitterId: varchar('twitter_id', { length: 50 }),
    twitterUserName: varchar('twitter_username', { length: 100 }),
  },
  (table) => {
    return {
      userIdIdx: index('user_id_idx').on(table.id),
    };
  },
);

export const assignmentSchema = pgTable(
  'assignments',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    userId: varchar('user_id', { length: 50 })
      .notNull()
      .references(() => userSchema.id),
    taskId: varchar('task_id', { length: 50 })
      .notNull()
      .references(() => taskSchema.id),
    isLiked: boolean('is_liked').default(false).notNull(),
    isCommented: boolean('is_commented').default(false).notNull(),
    isShared: boolean('is_shared').default(false).notNull(),
    isHandled: boolean('is_handled').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      assignmentUserIdIdx: index('assignment_user_and_task_id_idx').on(
        table.userId,
        table.taskId,
      ),
    };
  },
);
