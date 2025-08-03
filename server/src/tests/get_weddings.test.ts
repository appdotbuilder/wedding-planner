
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable } from '../db/schema';
import { type CreateWeddingInput } from '../schema';
import { getWeddings } from '../handlers/get_weddings';

// Test wedding data
const testWedding1: CreateWeddingInput = {
  title: 'Dream Wedding',
  bride_name: 'Alice Smith',
  groom_name: 'Bob Johnson',
  wedding_date: new Date('2024-06-15'),
  venue: 'Grand Ballroom',
  description: 'A beautiful outdoor ceremony',
  total_budget: 25000.50
};

const testWedding2: CreateWeddingInput = {
  title: 'Beach Wedding',
  bride_name: 'Carol Davis',
  groom_name: 'David Wilson',
  wedding_date: new Date('2024-08-20'),
  venue: 'Sunset Beach',
  description: 'A romantic beach ceremony',
  total_budget: 18500.75
};

describe('getWeddings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no weddings exist', async () => {
    const result = await getWeddings();
    expect(result).toEqual([]);
  });

  it('should return all weddings', async () => {
    // Create test weddings
    await db.insert(weddingsTable)
      .values([
        {
          ...testWedding1,
          total_budget: testWedding1.total_budget.toString()
        },
        {
          ...testWedding2,
          total_budget: testWedding2.total_budget.toString()
        }
      ])
      .execute();

    const result = await getWeddings();

    expect(result).toHaveLength(2);
    
    // Verify first wedding
    const wedding1 = result.find(w => w.title === 'Dream Wedding');
    expect(wedding1).toBeDefined();
    expect(wedding1?.bride_name).toEqual('Alice Smith');
    expect(wedding1?.groom_name).toEqual('Bob Johnson');
    expect(wedding1?.wedding_date).toEqual(new Date('2024-06-15'));
    expect(wedding1?.venue).toEqual('Grand Ballroom');
    expect(wedding1?.description).toEqual('A beautiful outdoor ceremony');
    expect(wedding1?.total_budget).toEqual(25000.50);
    expect(typeof wedding1?.total_budget).toEqual('number');
    expect(wedding1?.id).toBeDefined();
    expect(wedding1?.created_at).toBeInstanceOf(Date);

    // Verify second wedding
    const wedding2 = result.find(w => w.title === 'Beach Wedding');
    expect(wedding2).toBeDefined();
    expect(wedding2?.bride_name).toEqual('Carol Davis');
    expect(wedding2?.groom_name).toEqual('David Wilson');
    expect(wedding2?.total_budget).toEqual(18500.75);
    expect(typeof wedding2?.total_budget).toEqual('number');
  });

  it('should handle weddings with null fields correctly', async () => {
    // Create wedding with minimal required fields
    await db.insert(weddingsTable)
      .values({
        title: 'Simple Wedding',
        bride_name: 'Emma',
        groom_name: 'Frank',
        wedding_date: new Date('2024-12-01'),
        venue: null,
        description: null,
        total_budget: '5000.00'
      })
      .execute();

    const result = await getWeddings();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Simple Wedding');
    expect(result[0].venue).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].total_budget).toEqual(5000);
    expect(typeof result[0].total_budget).toEqual('number');
  });
});
