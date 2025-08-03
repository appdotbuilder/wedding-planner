
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export async function createTask(input: CreateTaskInput): Promise<Task> {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        wedding_id: input.wedding_id,
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        priority: input.priority,
        category: input.category,
        completed: false // Default value
      })
      .returning()
      .execute();

    const task = result[0];
    return task;
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
}
