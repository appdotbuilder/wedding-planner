
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, tasksTable } from '../db/schema';
import { type CreateWeddingInput, type CreateTaskInput, type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test data
const testWeddingInput: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane',
  groom_name: 'John',
  wedding_date: new Date('2024-06-15'),
  venue: 'Test Venue',
  description: 'A test wedding',
  total_budget: 25000
};

const testTaskInput: CreateTaskInput = {
  wedding_id: 1, // Will be updated after creating wedding
  title: 'Original Task',
  description: 'Original description',
  due_date: new Date('2024-05-01'),
  priority: 'medium',
  category: 'planning'
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task with all fields', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWeddingInput,
        total_budget: testWeddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    // Create task to update
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTaskInput,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskResult[0].id,
      title: 'Updated Task',
      description: 'Updated description',
      due_date: new Date('2024-06-01'),
      completed: true,
      priority: 'high',
      category: 'venue'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(taskResult[0].id);
    expect(result.title).toEqual('Updated Task');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date).toEqual(new Date('2024-06-01'));
    expect(result.completed).toEqual(true);
    expect(result.priority).toEqual('high');
    expect(result.category).toEqual('venue');
    expect(result.wedding_id).toEqual(weddingResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWeddingInput,
        total_budget: testWeddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    // Create task to update
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTaskInput,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskResult[0].id,
      completed: true,
      priority: 'high'
    };

    const result = await updateTask(updateInput);

    // Updated fields
    expect(result.completed).toEqual(true);
    expect(result.priority).toEqual('high');
    
    // Unchanged fields
    expect(result.title).toEqual('Original Task');
    expect(result.description).toEqual('Original description');
    expect(result.due_date).toEqual(new Date('2024-05-01'));
    expect(result.category).toEqual('planning');
  });

  it('should save updated task to database', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWeddingInput,
        total_budget: testWeddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    // Create task to update
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTaskInput,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskResult[0].id,
      title: 'Database Updated Task',
      completed: true
    };

    await updateTask(updateInput);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskResult[0].id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Task');
    expect(tasks[0].completed).toEqual(true);
    expect(tasks[0].description).toEqual('Original description'); // Unchanged
  });

  it('should handle null values correctly', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWeddingInput,
        total_budget: testWeddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    // Create task to update
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTaskInput,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskResult[0].id,
      description: null,
      due_date: null,
      category: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.category).toBeNull();
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });
});
