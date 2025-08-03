
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetWeddingTasksInput, type Task } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getWeddingTasks(input: GetWeddingTasksInput): Promise<Task[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(tasksTable.wedding_id, input.wedding_id)
    ];

    // Add optional filters
    if (input.completed !== undefined) {
      conditions.push(eq(tasksTable.completed, input.completed));
    }

    if (input.priority !== undefined) {
      conditions.push(eq(tasksTable.priority, input.priority));
    }

    // Build and execute query
    const results = await db.select()
      .from(tasksTable)
      .where(and(...conditions))
      .execute();

    // Return results (no numeric fields to convert in tasks table)
    return results;
  } catch (error) {
    console.error('Failed to get wedding tasks:', error);
    throw error;
  }
}
