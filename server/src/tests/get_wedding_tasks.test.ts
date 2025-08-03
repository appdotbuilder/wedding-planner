
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, tasksTable } from '../db/schema';
import { type GetWeddingTasksInput, type CreateWeddingInput, type CreateTaskInput } from '../schema';
import { getWeddingTasks } from '../handlers/get_wedding_tasks';

// Test wedding data
const testWedding: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane',
  groom_name: 'John',
  wedding_date: new Date('2024-06-15'),
  venue: 'Test Venue',
  description: 'A beautiful test wedding',
  total_budget: 25000
};

// Test task data
const testTask1: CreateTaskInput = {
  wedding_id: 1, // Will be updated in tests
  title: 'Book photographer',
  description: 'Find and book wedding photographer',
  due_date: new Date('2024-05-01'),
  priority: 'high',
  category: 'photography'
};

const testTask2: CreateTaskInput = {
  wedding_id: 1, // Will be updated in tests
  title: 'Order flowers',
  description: 'Choose and order bridal bouquet',
  due_date: new Date('2024-06-01'),
  priority: 'medium',
  category: 'flowers'
};

const testTask3: CreateTaskInput = {
  wedding_id: 1, // Will be updated in tests
  title: 'Send invitations',
  description: 'Mail wedding invitations',
  due_date: new Date('2024-04-15'),
  priority: 'low',
  category: 'invitations'
};

describe('getWeddingTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all tasks for a wedding', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create tasks
    await db.insert(tasksTable)
      .values([
        { ...testTask1, wedding_id: weddingId },
        { ...testTask2, wedding_id: weddingId },
        { ...testTask3, wedding_id: weddingId }
      ])
      .execute();

    const input: GetWeddingTasksInput = {
      wedding_id: weddingId
    };

    const result = await getWeddingTasks(input);

    expect(result).toHaveLength(3);
    expect(result[0].wedding_id).toEqual(weddingId);
    expect(result[0].title).toEqual('Book photographer');
    expect(result[0].priority).toEqual('high');
    expect(result[0].completed).toEqual(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter tasks by completion status', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create tasks with different completion status
    await db.insert(tasksTable)
      .values([
        { ...testTask1, wedding_id: weddingId, completed: true },
        { ...testTask2, wedding_id: weddingId, completed: false },
        { ...testTask3, wedding_id: weddingId, completed: false }
      ])
      .execute();

    // Get completed tasks
    const completedInput: GetWeddingTasksInput = {
      wedding_id: weddingId,
      completed: true
    };

    const completedResult = await getWeddingTasks(completedInput);

    expect(completedResult).toHaveLength(1);
    expect(completedResult[0].completed).toEqual(true);
    expect(completedResult[0].title).toEqual('Book photographer');

    // Get incomplete tasks
    const incompleteInput: GetWeddingTasksInput = {
      wedding_id: weddingId,
      completed: false
    };

    const incompleteResult = await getWeddingTasks(incompleteInput);

    expect(incompleteResult).toHaveLength(2);
    incompleteResult.forEach(task => {
      expect(task.completed).toEqual(false);
    });
  });

  it('should filter tasks by priority', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create tasks
    await db.insert(tasksTable)
      .values([
        { ...testTask1, wedding_id: weddingId }, // high priority
        { ...testTask2, wedding_id: weddingId }, // medium priority
        { ...testTask3, wedding_id: weddingId }  // low priority
      ])
      .execute();

    // Get high priority tasks
    const highPriorityInput: GetWeddingTasksInput = {
      wedding_id: weddingId,
      priority: 'high'
    };

    const highPriorityResult = await getWeddingTasks(highPriorityInput);

    expect(highPriorityResult).toHaveLength(1);
    expect(highPriorityResult[0].priority).toEqual('high');
    expect(highPriorityResult[0].title).toEqual('Book photographer');

    // Get medium priority tasks
    const mediumPriorityInput: GetWeddingTasksInput = {
      wedding_id: weddingId,
      priority: 'medium'
    };

    const mediumPriorityResult = await getWeddingTasks(mediumPriorityInput);

    expect(mediumPriorityResult).toHaveLength(1);
    expect(mediumPriorityResult[0].priority).toEqual('medium');
    expect(mediumPriorityResult[0].title).toEqual('Order flowers');
  });

  it('should filter by both completion status and priority', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create tasks with mixed statuses
    await db.insert(tasksTable)
      .values([
        { ...testTask1, wedding_id: weddingId, completed: true },  // high, completed
        { ...testTask2, wedding_id: weddingId, completed: false }, // medium, incomplete
        { ...testTask3, wedding_id: weddingId, completed: false }  // low, incomplete
      ])
      .execute();

    // Get incomplete high priority tasks (should be none)
    const input: GetWeddingTasksInput = {
      wedding_id: weddingId,
      completed: false,
      priority: 'high'
    };

    const result = await getWeddingTasks(input);

    expect(result).toHaveLength(0);

    // Get incomplete medium priority tasks
    const mediumIncompleteInput: GetWeddingTasksInput = {
      wedding_id: weddingId,
      completed: false,
      priority: 'medium'
    };

    const mediumIncompleteResult = await getWeddingTasks(mediumIncompleteInput);

    expect(mediumIncompleteResult).toHaveLength(1);
    expect(mediumIncompleteResult[0].priority).toEqual('medium');
    expect(mediumIncompleteResult[0].completed).toEqual(false);
  });

  it('should return empty array for non-existent wedding', async () => {
    const input: GetWeddingTasksInput = {
      wedding_id: 999
    };

    const result = await getWeddingTasks(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no tasks match filters', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create only low priority tasks
    await db.insert(tasksTable)
      .values([
        { ...testTask3, wedding_id: weddingId } // low priority
      ])
      .execute();

    // Try to get high priority tasks
    const input: GetWeddingTasksInput = {
      wedding_id: weddingId,
      priority: 'high'
    };

    const result = await getWeddingTasks(input);

    expect(result).toHaveLength(0);
  });
});
