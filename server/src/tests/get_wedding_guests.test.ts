
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, guestsTable } from '../db/schema';
import { type GetWeddingGuestsInput, type CreateWeddingInput, type CreateGuestInput } from '../schema';
import { getWeddingGuests } from '../handlers/get_wedding_guests';
import { eq } from 'drizzle-orm';

// Test wedding data
const testWedding: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane Doe',
  groom_name: 'John Smith',
  wedding_date: new Date('2024-06-15'),
  venue: 'Test Venue',
  description: 'A test wedding',
  total_budget: 25000
};

// Test guest data
const testGuest1: CreateGuestInput = {
  wedding_id: 1, // Will be updated after creating wedding
  name: 'Alice Johnson',
  email: 'alice@example.com',
  phone: '555-0101',
  address: '123 Main St',
  plus_one: true,
  dietary_restrictions: 'Vegetarian',
  table_number: 1
};

const testGuest2: CreateGuestInput = {
  wedding_id: 1, // Will be updated after creating wedding
  name: 'Bob Wilson',
  email: 'bob@example.com',
  phone: '555-0102',
  address: '456 Oak Ave',
  plus_one: false,
  dietary_restrictions: null,
  table_number: 2
};

describe('getWeddingGuests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all guests for a wedding', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        wedding_date: testWedding.wedding_date,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create guests
    await db.insert(guestsTable)
      .values([
        {
          ...testGuest1,
          wedding_id: weddingId
        },
        {
          ...testGuest2, 
          wedding_id: weddingId
        }
      ])
      .execute();

    const input: GetWeddingGuestsInput = {
      wedding_id: weddingId
    };

    const result = await getWeddingGuests(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].email).toEqual('alice@example.com');
    expect(result[0].plus_one).toBe(true);
    expect(result[0].dietary_restrictions).toEqual('Vegetarian');
    expect(result[0].rsvp_status).toEqual('pending'); // Default value
    expect(result[0].wedding_id).toEqual(weddingId);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Bob Wilson');
    expect(result[1].plus_one).toBe(false);
    expect(result[1].dietary_restrictions).toBeNull();
  });

  it('should filter guests by RSVP status', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        wedding_date: testWedding.wedding_date,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create guests with different RSVP statuses
    await db.insert(guestsTable)
      .values([
        {
          ...testGuest1,
          wedding_id: weddingId
        },
        {
          ...testGuest2,
          wedding_id: weddingId
        }
      ])
      .execute();

    // Update one guest's RSVP status
    await db.update(guestsTable)
      .set({ rsvp_status: 'attending' })
      .where(eq(guestsTable.name, 'Alice Johnson'))
      .execute();

    // Filter for attending guests only
    const input: GetWeddingGuestsInput = {
      wedding_id: weddingId,
      rsvp_status: 'attending'
    };

    const result = await getWeddingGuests(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Alice Johnson');
    expect(result[0].rsvp_status).toEqual('attending');
  });

  it('should return empty array for wedding with no guests', async () => {
    // Create wedding without guests
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        wedding_date: testWedding.wedding_date,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const input: GetWeddingGuestsInput = {
      wedding_id: weddingResult[0].id
    };

    const result = await getWeddingGuests(input);

    expect(result).toHaveLength(0);
  });

  it('should handle numeric gift_value conversion correctly', async () => {
    // Create wedding
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        wedding_date: testWedding.wedding_date,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    const weddingId = weddingResult[0].id;

    // Create guest with gift value
    await db.insert(guestsTable)
      .values({
        ...testGuest1,
        wedding_id: weddingId,
        gift_description: 'Wedding Gift',
        gift_value: '150.75' // Stored as string in DB
      })
      .execute();

    const input: GetWeddingGuestsInput = {
      wedding_id: weddingId
    };

    const result = await getWeddingGuests(input);

    expect(result).toHaveLength(1);
    expect(result[0].gift_value).toEqual(150.75);
    expect(typeof result[0].gift_value).toBe('number');
  });

  it('should return empty array for non-existent wedding', async () => {
    const input: GetWeddingGuestsInput = {
      wedding_id: 999 // Non-existent wedding ID
    };

    const result = await getWeddingGuests(input);

    expect(result).toHaveLength(0);
  });
});
