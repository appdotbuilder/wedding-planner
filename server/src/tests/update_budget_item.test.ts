
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, budgetItemsTable } from '../db/schema';
import { type CreateWeddingInput, type CreateBudgetItemInput, type UpdateBudgetItemInput } from '../schema';
import { updateBudgetItem } from '../handlers/update_budget_item';
import { eq } from 'drizzle-orm';

// Test data
const testWedding: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane',
  groom_name: 'John',
  wedding_date: new Date('2024-06-15'),
  venue: 'Test Venue',
  description: 'A test wedding',
  total_budget: 25000
};

const testBudgetItem: CreateBudgetItemInput = {
  wedding_id: 1, // Will be set after wedding creation
  category: 'Catering',
  item_name: 'Wedding Cake',
  estimated_cost: 500,
  actual_cost: null,
  paid: false,
  vendor: 'Sweet Treats Bakery',
  notes: 'Three tier cake'
};

describe('updateBudgetItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a budget item with all fields', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();
    
    const weddingId = weddingResult[0].id;

    // Create budget item to update
    const budgetItemResult = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        wedding_id: weddingId,
        estimated_cost: testBudgetItem.estimated_cost.toString(),
        actual_cost: testBudgetItem.actual_cost?.toString() || null
      })
      .returning()
      .execute();

    const budgetItemId = budgetItemResult[0].id;

    // Update the budget item
    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      category: 'Desserts',
      item_name: 'Wedding Cake - Premium',
      estimated_cost: 600,
      actual_cost: 550,
      paid: true,
      vendor: 'Premium Cakes Co',
      notes: 'Three tier premium cake with custom decorations'
    };

    const result = await updateBudgetItem(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(budgetItemId);
    expect(result.category).toEqual('Desserts');
    expect(result.item_name).toEqual('Wedding Cake - Premium');
    expect(result.estimated_cost).toEqual(600);
    expect(typeof result.estimated_cost).toEqual('number');
    expect(result.actual_cost).toEqual(550);
    expect(typeof result.actual_cost).toEqual('number');
    expect(result.paid).toEqual(true);
    expect(result.vendor).toEqual('Premium Cakes Co');
    expect(result.notes).toEqual('Three tier premium cake with custom decorations');
    expect(result.wedding_id).toEqual(weddingId);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();
    
    const weddingId = weddingResult[0].id;

    // Create budget item to update
    const budgetItemResult = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        wedding_id: weddingId,
        estimated_cost: testBudgetItem.estimated_cost.toString(),
        actual_cost: testBudgetItem.actual_cost?.toString() || null
      })
      .returning()
      .execute();

    const budgetItemId = budgetItemResult[0].id;

    // Update only actual cost and paid status
    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      actual_cost: 475,
      paid: true
    };

    const result = await updateBudgetItem(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(budgetItemId);
    expect(result.category).toEqual('Catering'); // Unchanged
    expect(result.item_name).toEqual('Wedding Cake'); // Unchanged
    expect(result.estimated_cost).toEqual(500); // Unchanged
    expect(result.actual_cost).toEqual(475); // Updated
    expect(typeof result.actual_cost).toEqual('number');
    expect(result.paid).toEqual(true); // Updated
    expect(result.vendor).toEqual('Sweet Treats Bakery'); // Unchanged
    expect(result.notes).toEqual('Three tier cake'); // Unchanged
    expect(result.wedding_id).toEqual(weddingId);
  });

  it('should save changes to database', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();
    
    const weddingId = weddingResult[0].id;

    // Create budget item to update
    const budgetItemResult = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        wedding_id: weddingId,
        estimated_cost: testBudgetItem.estimated_cost.toString(),
        actual_cost: testBudgetItem.actual_cost?.toString() || null
      })
      .returning()
      .execute();

    const budgetItemId = budgetItemResult[0].id;

    // Update the budget item
    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      actual_cost: 525,
      paid: true,
      notes: 'Updated notes'
    };

    await updateBudgetItem(updateInput);

    // Verify changes were saved to database
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, budgetItemId))
      .execute();

    expect(budgetItems).toHaveLength(1);
    const savedItem = budgetItems[0];
    expect(parseFloat(savedItem.actual_cost!)).toEqual(525);
    expect(savedItem.paid).toEqual(true);
    expect(savedItem.notes).toEqual('Updated notes');
    // Unchanged fields should remain the same
    expect(savedItem.category).toEqual('Catering');
    expect(savedItem.item_name).toEqual('Wedding Cake');
    expect(parseFloat(savedItem.estimated_cost)).toEqual(500);
  });

  it('should handle setting actual_cost to null', async () => {
    // Create prerequisite wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();
    
    const weddingId = weddingResult[0].id;

    // Create budget item with actual cost
    const budgetItemResult = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        wedding_id: weddingId,
        estimated_cost: testBudgetItem.estimated_cost.toString(),
        actual_cost: '400' // Set an initial actual cost
      })
      .returning()
      .execute();

    const budgetItemId = budgetItemResult[0].id;

    // Update to set actual_cost to null
    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      actual_cost: null
    };

    const result = await updateBudgetItem(updateInput);

    expect(result.actual_cost).toBeNull();
    
    // Verify in database
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, budgetItemId))
      .execute();

    expect(budgetItems[0].actual_cost).toBeNull();
  });

  it('should throw error for non-existent budget item', async () => {
    const updateInput: UpdateBudgetItemInput = {
      id: 999,
      paid: true
    };

    expect(updateBudgetItem(updateInput)).rejects.toThrow(/budget item with id 999 not found/i);
  });
});
