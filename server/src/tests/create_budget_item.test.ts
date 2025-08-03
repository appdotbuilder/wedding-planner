
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetItemsTable, weddingsTable } from '../db/schema';
import { type CreateWeddingInput, type CreateBudgetItemInput } from '../schema';
import { createBudgetItem } from '../handlers/create_budget_item';
import { eq } from 'drizzle-orm';

// Test wedding for prerequisite data
const testWedding: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane Doe',
  groom_name: 'John Smith',
  wedding_date: new Date('2024-06-15'),
  venue: 'Beach Resort',
  description: 'Beach wedding ceremony',
  total_budget: 25000.00
};

// Test budget item input
const testInput: CreateBudgetItemInput = {
  wedding_id: 1, // Will be set after creating wedding
  category: 'Catering',
  item_name: 'Wedding Dinner',
  estimated_cost: 5000.00,
  actual_cost: 4800.00,
  paid: true,
  vendor: 'Gourmet Catering Co',
  notes: 'Includes 3-course meal for 100 guests'
};

describe('createBudgetItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget item', async () => {
    // Create prerequisite wedding
    const wedding = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString(),
        wedding_date: testWedding.wedding_date
      })
      .returning()
      .execute();

    const budgetItemInput = { ...testInput, wedding_id: wedding[0].id };
    const result = await createBudgetItem(budgetItemInput);

    // Basic field validation
    expect(result.wedding_id).toEqual(wedding[0].id);
    expect(result.category).toEqual('Catering');
    expect(result.item_name).toEqual('Wedding Dinner');
    expect(result.estimated_cost).toEqual(5000.00);
    expect(typeof result.estimated_cost).toBe('number');
    expect(result.actual_cost).toEqual(4800.00);
    expect(typeof result.actual_cost).toBe('number');
    expect(result.paid).toEqual(true);
    expect(result.vendor).toEqual('Gourmet Catering Co');
    expect(result.notes).toEqual('Includes 3-course meal for 100 guests');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save budget item to database', async () => {
    // Create prerequisite wedding
    const wedding = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString(),
        wedding_date: testWedding.wedding_date
      })
      .returning()
      .execute();

    const budgetItemInput = { ...testInput, wedding_id: wedding[0].id };
    const result = await createBudgetItem(budgetItemInput);

    // Query using proper drizzle syntax
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, result.id))
      .execute();

    expect(budgetItems).toHaveLength(1);
    expect(budgetItems[0].category).toEqual('Catering');
    expect(budgetItems[0].item_name).toEqual('Wedding Dinner');
    expect(parseFloat(budgetItems[0].estimated_cost)).toEqual(5000.00);
    expect(parseFloat(budgetItems[0].actual_cost!)).toEqual(4800.00);
    expect(budgetItems[0].paid).toEqual(true);
    expect(budgetItems[0].vendor).toEqual('Gourmet Catering Co');
    expect(budgetItems[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null actual_cost', async () => {
    // Create prerequisite wedding
    const wedding = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString(),
        wedding_date: testWedding.wedding_date
      })
      .returning()
      .execute();

    const budgetItemInput = {
      ...testInput,
      wedding_id: wedding[0].id,
      actual_cost: null
    };

    const result = await createBudgetItem(budgetItemInput);

    expect(result.actual_cost).toBeNull();
    expect(result.estimated_cost).toEqual(5000.00);
    expect(typeof result.estimated_cost).toBe('number');
  });

  it('should throw error when wedding does not exist', async () => {
    const budgetItemInput = { ...testInput, wedding_id: 999 };

    await expect(createBudgetItem(budgetItemInput)).rejects.toThrow(/wedding not found/i);
  });
});
