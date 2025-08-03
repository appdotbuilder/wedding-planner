
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, tasksTable } from '../db/schema';
import { type CreateTaskInput, type CreateWeddingInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let weddingId: number;

  beforeEach(async () => {
    // Create prerequisite wedding data
    const weddingInput: CreateWeddingInput = {
      title: 'Test Wedding',
      bride_name: 'Jane Doe',
      groom_name: 'John Smith',
      wedding_date: new Date('2024-06-15'),
      venue: 'Test Venue',
      description: 'A beautiful wedding',
      total_budget: 50000
    };

    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...weddingInput,
        total_budget: weddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    weddingId = weddingResult[0].id;
  });

  it('should create a task with all required fields', async () => {
    const testInput: CreateTaskInput = {
      wedding_id: weddingId,
      title: 'Book flowers',
      description: 'Contact florist for bridal bouquet',
      due_date: new Date('2024-05-15'),
      priority: 'high',
      category: 'Flowers'
    };

    const result = await createTask(testInput);

    // Basic field validation
    expect(result.wedding_id).toEqual(weddingId);
    expect(result.title).toEqual('Book flowers');
    expect(result.description).toEqual('Contact florist for bridal bouquet');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date).toEqual(new Date('2024-05-15'));
    expect(result.priority).toEqual('high');
    expect(result.category).toEqual('Flowers');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal required fields', async () => {
    const testInput: CreateTaskInput = {
      wedding_id: weddingId,
      title: 'Simple task',
      description: null,
      due_date: null,
      priority: 'low',
      category: null
    };

    const result = await createTask(testInput);

    expect(result.wedding_id).toEqual(weddingId);
    expect(result.title).toEqual('Simple task');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('low');
    expect(result.category).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const testInput: CreateTaskInput = {
      wedding_id: weddingId,
      title: 'Book venue',
      description: 'Reserve wedding venue',
      due_date: new Date('2024-04-01'),
      priority: 'medium',
      category: 'Venue'
    };

    const result = await createTask(testInput);

    // Query the database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].wedding_id).toEqual(weddingId);
    expect(tasks[0].title).toEqual('Book venue');
    expect(tasks[0].description).toEqual('Reserve wedding venue');
    expect(tasks[0].due_date).toBeInstanceOf(Date);
    expect(tasks[0].priority).toEqual('medium');
    expect(tasks[0].category).toEqual('Venue');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple tasks for the same wedding', async () => {
    const task1Input: CreateTaskInput = {
      wedding_id: weddingId,
      title: 'Book photographer',
      description: 'Find and book wedding photographer',
      due_date: new Date('2024-03-01'),
      priority: 'high',
      category: 'Photography'
    };

    const task2Input: CreateTaskInput = {
      wedding_id: weddingId,
      title: 'Order cake',
      description: 'Order wedding cake from bakery',
      due_date: new Date('2024-05-01'),
      priority: 'medium',
      category: 'Catering'
    };

    const result1 = await createTask(task1Input);
    const result2 = await createTask(task2Input);

    // Verify both tasks were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.wedding_id).toEqual(weddingId);
    expect(result2.wedding_id).toEqual(weddingId);
    expect(result1.title).toEqual('Book photographer');
    expect(result2.title).toEqual('Order cake');

    // Verify both tasks exist in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.wedding_id, weddingId))
      .execute();

    expect(tasks).toHaveLength(2);
  });
});
