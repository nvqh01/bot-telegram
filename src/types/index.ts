import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { taskSchema, userSchema } from '../schemas';

export type Task = InferSelectModel<typeof taskSchema>;
export type NewTask = InferInsertModel<typeof taskSchema>;

export type User = InferSelectModel<typeof userSchema>;
export type NewUser = InferInsertModel<typeof userSchema>;
