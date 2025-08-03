
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, guestsTable } from '../db/schema';
import { type CreateWeddingInput, type CreateGuestInput, type UpdateGuestRsvpInput } from '../schema';
import { updateGuestRsvp } from '../handlers/update_guest_rsvp';
import { eq } from 'drizzle-orm';

// Test wedding data
const testWedding: CreateWeddingInput = {
  title: 'Test Wedding',
  bride_name: 'Jane',
  groom_name: 'John',
  wedding_date: new Date('2024-06-01'),
  venue: 'Test Venue',
  description: 'A test wedding',
  total_budget: 25000
};

// Test guest data
const testGuest: CreateGuestInput = {
  wedding_id: 0, // Will be set after wedding creation
  name: 'Alice Smith',
  email: 'alice@example.com',
  phone: '555-1234',
  address: '123 Main St',
  plus_one: false,
  dietary_restrictions: null,
  table_number: null
};

describe('updateGuestRsvp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update guest RSVP status', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    // Create guest
    const guestResult = await db.insert(guestsTable)
      .values({
        ...testGuest,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateGuestRsvpInput = {
      id: guestResult[0].id,
      rsvp_status: 'attending'
    };

    const result = await updateGuestRsvp(updateInput);

    expect(result.id).toEqual(guestResult[0].id);
    expect(result.rsvp_status).toEqual('attending');
    expect(result.name).toEqual('Alice Smith');
    expect(result.email).toEqual('alice@example.com');
    expect(result.dietary_restrictions).toBeNull();
  });

  it('should update guest RSVP status with dietary restrictions', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    // Create guest
    const guestResult = await db.insert(guestsTable)
      .values({
        ...testGuest,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateGuestRsvpInput = {
      id: guestResult[0].id,
      rsvp_status: 'attending',
      dietary_restrictions: 'Vegetarian'
    };

    const result = await updateGuestRsvp(updateInput);

    expect(result.id).toEqual(guestResult[0].id);
    expect(result.rsvp_status).toEqual('attending');
    expect(result.dietary_restrictions).toEqual('Vegetarian');
    expect(result.name).toEqual('Alice Smith');
  });

  it('should save updated RSVP to database', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    // Create guest
    const guestResult = await db.insert(guestsTable)
      .values({
        ...testGuest,
        wedding_id: weddingResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateGuestRsvpInput = {
      id: guestResult[0].id,
      rsvp_status: 'not_attending',
      dietary_restrictions: 'No restrictions'
    };

    await updateGuestRsvp(updateInput);

    // Verify in database
    const guests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, guestResult[0].id))
      .execute();

    expect(guests).toHaveLength(1);
    expect(guests[0].rsvp_status).toEqual('not_attending');
    expect(guests[0].dietary_restrictions).toEqual('No restrictions');
  });

  it('should throw error for non-existent guest', async () => {
    const updateInput: UpdateGuestRsvpInput = {
      id: 999,
      rsvp_status: 'attending'
    };

    expect(updateGuestRsvp(updateInput)).rejects.toThrow(/guest with id 999 not found/i);
  });

  it('should handle guest with existing gift value correctly', async () => {
    // Create wedding first
    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...testWedding,
        total_budget: testWedding.total_budget.toString()
      })
      .returning()
      .execute();

    // Create guest with gift value
    const guestResult = await db.insert(guestsTable)
      .values({
        ...testGuest,
        wedding_id: weddingResult[0].id,
        gift_value: '150.50'
      })
      .returning()
      .execute();

    const updateInput: UpdateGuestRsvpInput = {
      id: guestResult[0].id,
      rsvp_status: 'attending'
    };

    const result = await updateGuestRsvp(updateInput);

    expect(result.rsvp_status).toEqual('attending');
    expect(result.gift_value).toEqual(150.5);
    expect(typeof result.gift_value).toBe('number');
  });
});
