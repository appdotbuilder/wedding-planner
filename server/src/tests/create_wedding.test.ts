
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable } from '../db/schema';
import { type CreateWeddingInput } from '../schema';
import { createWedding } from '../handlers/create_wedding';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateWeddingInput = {
  title: 'Sarah & John Wedding',
  bride_name: 'Sarah Smith',
  groom_name: 'John Doe',
  wedding_date: new Date('2024-06-15'),
  venue: 'Grand Ballroom',
  description: 'A beautiful summer wedding',
  total_budget: 25000.50
};

describe('createWedding', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a wedding', async () => {
    const result = await createWedding(testInput);

    // Basic field validation
    expect(result.title).toEqual('Sarah & John Wedding');
    expect(result.bride_name).toEqual('Sarah Smith');
    expect(result.groom_name).toEqual('John Doe');
    expect(result.wedding_date).toBeInstanceOf(Date);
    expect(result.wedding_date.toISOString().split('T')[0]).toEqual('2024-06-15');
    expect(result.venue).toEqual('Grand Ballroom');
    expect(result.description).toEqual('A beautiful summer wedding');
    expect(result.total_budget).toEqual(25000.50);
    expect(typeof result.total_budget).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save wedding to database', async () => {
    const result = await createWedding(testInput);

    // Query using proper drizzle syntax
    const weddings = await db.select()
      .from(weddingsTable)
      .where(eq(weddingsTable.id, result.id))
      .execute();

    expect(weddings).toHaveLength(1);
    expect(weddings[0].title).toEqual('Sarah & John Wedding');
    expect(weddings[0].bride_name).toEqual('Sarah Smith');
    expect(weddings[0].groom_name).toEqual('John Doe');
    expect(weddings[0].wedding_date).toBeInstanceOf(Date);
    expect(weddings[0].venue).toEqual('Grand Ballroom');
    expect(weddings[0].description).toEqual('A beautiful summer wedding');
    expect(parseFloat(weddings[0].total_budget)).toEqual(25000.50);
    expect(weddings[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle wedding with null optional fields', async () => {
    const minimalInput: CreateWeddingInput = {
      title: 'Simple Wedding',
      bride_name: 'Jane',
      groom_name: 'Bob',
      wedding_date: new Date('2024-12-25'),
      venue: null,
      description: null,
      total_budget: 10000
    };

    const result = await createWedding(minimalInput);

    expect(result.title).toEqual('Simple Wedding');
    expect(result.bride_name).toEqual('Jane');
    expect(result.groom_name).toEqual('Bob');
    expect(result.venue).toBeNull();
    expect(result.description).toBeNull();
    expect(result.total_budget).toEqual(10000);
    expect(result.id).toBeDefined();
  });

  it('should handle zero budget correctly', async () => {
    const zeroBudgetInput: CreateWeddingInput = {
      ...testInput,
      total_budget: 0
    };

    const result = await createWedding(zeroBudgetInput);

    expect(result.total_budget).toEqual(0);
    expect(typeof result.total_budget).toEqual('number');
  });
});
