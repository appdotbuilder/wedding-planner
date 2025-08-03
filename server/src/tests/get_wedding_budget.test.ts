
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, budgetItemsTable } from '../db/schema';
import { type GetWeddingBudgetInput, type CreateWeddingInput, type CreateBudgetItemInput } from '../schema';
import { getWeddingBudget } from '../handlers/get_wedding_budget';

// Test wedding data
const testWedding: CreateWeddingInput = {
  title: 'John & Jane Wedding',
  bride_name: 'Jane Smith',
  groom_name: 'John Doe',
  wedding_date: new Date('2024-06-15'),
  venue: 'Garden Resort',
  description: 'Beautiful outdoor wedding',
  total_budget: 25000
};

// Test budget items
const testBudgetItems: CreateBudgetItemInput[] = [
  {
    wedding_id: 1, // Will be set after wedding creation
    category: 'venue',
    item_name: 'Reception Hall',
    estimated_cost: 5000,
    actual_cost: 5200,
    paid: true,
    vendor: 'Garden Resort',
    notes: 'Includes tables and chairs'
  },
  {
    wedding_id: 1,
    category: 'catering',
    item_name: 'Wedding Dinner',
    estimated_cost: 8000,
    actual_cost: null,
    paid: false,
    vendor: 'Gourmet Catering',
    notes: null
  },
  {
    wedding_id: 1,
    category: 'flowers',
    item_name: 'Bridal Bouquet',
    estimated_cost: 200,
    actual_cost: 180,
    paid: true,
    vendor: 'Flower Power',
    notes: 'White roses and baby breath'
  },
  {
    wedding_id: 1,
    category: 'venue',
    item_name: 'Ceremony Space',
    estimated_cost: 1500,
    actual_cost: null,
    paid: false,
    vendor: 'Garden Resort',
    notes: 'Garden ceremony area'
  }
];

describe('getWeddingBudget', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all budget items for a wedding', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        title: testWedding.title,
        bride_name: testWedding.bride_name,
        groom_name: testWedding.groom_name,
        wedding_date: testWedding.wedding_date,
        venue: testWedding.venue,
        description: testWedding.description,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create budget items
    const budgetItemsToInsert = testBudgetItems.map(item => ({
      ...item,
      wedding_id: weddingId,
      estimated_cost: item.estimated_cost.toString(),
      actual_cost: item.actual_cost?.toString() || null
    }));

    await db.insert(budgetItemsTable)
      .values(budgetItemsToInsert)
      .execute();

    // Test the handler
    const input: GetWeddingBudgetInput = {
      wedding_id: weddingId
    };

    const result = await getWeddingBudget(input);

    // Verify results
    expect(result).toHaveLength(4);
    
    // Check that all items belong to the correct wedding
    result.forEach(item => {
      expect(item.wedding_id).toEqual(weddingId);
      expect(typeof item.estimated_cost).toBe('number');
      expect(item.actual_cost === null || typeof item.actual_cost === 'number').toBe(true);
    });

    // Check specific items
    const venueItem = result.find(item => item.item_name === 'Reception Hall');
    expect(venueItem).toBeDefined();
    expect(venueItem!.category).toEqual('venue');
    expect(venueItem!.estimated_cost).toEqual(5000);
    expect(venueItem!.actual_cost).toEqual(5200);
    expect(venueItem!.paid).toBe(true);

    const cateringItem = result.find(item => item.item_name === 'Wedding Dinner');
    expect(cateringItem).toBeDefined();
    expect(cateringItem!.category).toEqual('catering');
    expect(cateringItem!.estimated_cost).toEqual(8000);
    expect(cateringItem!.actual_cost).toBeNull();
    expect(cateringItem!.paid).toBe(false);
  });

  it('should filter budget items by category', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        title: testWedding.title,
        bride_name: testWedding.bride_name,
        groom_name: testWedding.groom_name,
        wedding_date: testWedding.wedding_date,
        venue: testWedding.venue,
        description: testWedding.description,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create budget items
    const budgetItemsToInsert = testBudgetItems.map(item => ({
      ...item,
      wedding_id: weddingId,
      estimated_cost: item.estimated_cost.toString(),
      actual_cost: item.actual_cost?.toString() || null
    }));

    await db.insert(budgetItemsTable)
      .values(budgetItemsToInsert)
      .execute();

    // Test filtering by venue category
    const input: GetWeddingBudgetInput = {
      wedding_id: weddingId,
      category: 'venue'
    };

    const result = await getWeddingBudget(input);

    // Should return only venue items
    expect(result).toHaveLength(2);
    result.forEach(item => {
      expect(item.category).toEqual('venue');
      expect(item.wedding_id).toEqual(weddingId);
    });

    // Check specific venue items
    const receptionHall = result.find(item => item.item_name === 'Reception Hall');
    expect(receptionHall).toBeDefined();
    
    const ceremonySpace = result.find(item => item.item_name === 'Ceremony Space');
    expect(ceremonySpace).toBeDefined();
  });

  it('should return empty array for non-existent wedding', async () => {
    const input: GetWeddingBudgetInput = {
      wedding_id: 999
    };

    const result = await getWeddingBudget(input);
    expect(result).toHaveLength(0);
  });

  it('should return empty array when category has no items', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        title: testWedding.title,
        bride_name: testWedding.bride_name,
        groom_name: testWedding.groom_name,
        wedding_date: testWedding.wedding_date,
        venue: testWedding.venue,
        description: testWedding.description,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Test filtering by category that doesn't exist
    const input: GetWeddingBudgetInput = {
      wedding_id: weddingId,
      category: 'photography'
    };

    const result = await getWeddingBudget(input);
    expect(result).toHaveLength(0);
  });
});
