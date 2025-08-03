
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weddingsTable, guestsTable } from '../db/schema';
import { type UpdateGuestGiftInput, type CreateWeddingInput, type CreateGuestInput } from '../schema';
import { updateGuestGift } from '../handlers/update_guest_gift';
import { eq } from 'drizzle-orm';

describe('updateGuestGift', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testWeddingId: number;
  let testGuestId: number;

  beforeEach(async () => {
    // Create prerequisite wedding
    const weddingInput: CreateWeddingInput = {
      title: 'Test Wedding',
      bride_name: 'Jane Doe',
      groom_name: 'John Doe',
      wedding_date: new Date('2024-06-15'),
      venue: 'Test Venue',
      description: 'A test wedding',
      total_budget: 50000
    };

    const weddingResult = await db.insert(weddingsTable)
      .values({
        ...weddingInput,
        total_budget: weddingInput.total_budget.toString()
      })
      .returning()
      .execute();

    testWeddingId = weddingResult[0].id;

    // Create prerequisite guest
    const guestInput: CreateGuestInput = {
      wedding_id: testWeddingId,
      name: 'Test Guest',
      email: 'guest@example.com',
      phone: '123-456-7890',
      address: '123 Test St',
      plus_one: false,
      dietary_restrictions: null,
      table_number: null
    };

    const guestResult = await db.insert(guestsTable)
      .values(guestInput)
      .returning()
      .execute();

    testGuestId = guestResult[0].id;
  });

  it('should update guest gift information', async () => {
    const input: UpdateGuestGiftInput = {
      id: testGuestId,
      gift_description: 'Beautiful crystal vase',
      gift_value: 150.00
    };

    const result = await updateGuestGift(input);

    expect(result.id).toEqual(testGuestId);
    expect(result.gift_description).toEqual('Beautiful crystal vase');
    expect(result.gift_value).toEqual(150.00);
    expect(typeof result.gift_value).toBe('number');
    expect(result.name).toEqual('Test Guest');
  });

  it('should handle null gift values', async () => {
    const input: UpdateGuestGiftInput = {
      id: testGuestId,
      gift_description: 'Card only',
      gift_value: null
    };

    const result = await updateGuestGift(input);

    expect(result.gift_description).toEqual('Card only');
    expect(result.gift_value).toBeNull();
  });

  it('should save gift information to database', async () => {
    const input: UpdateGuestGiftInput = {
      id: testGuestId,
      gift_description: 'Silver picture frame',
      gift_value: 75.50
    };

    await updateGuestGift(input);

    // Query database to verify update
    const guests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, testGuestId))
      .execute();

    expect(guests).toHaveLength(1);
    expect(guests[0].gift_description).toEqual('Silver picture frame');
    expect(parseFloat(guests[0].gift_value!)).toEqual(75.50);
  });

  it('should throw error for non-existent guest', async () => {
    const input: UpdateGuestGiftInput = {
      id: 99999,
      gift_description: 'Test gift',
      gift_value: 100.00
    };

    expect(updateGuestGift(input)).rejects.toThrow(/Guest with id 99999 not found/i);
  });

  it('should preserve other guest fields', async () => {
    const input: UpdateGuestGiftInput = {
      id: testGuestId,
      gift_description: 'Wedding album',
      gift_value: 200.00
    };

    const result = await updateGuestGift(input);

    // Verify other fields are preserved
    expect(result.name).toEqual('Test Guest');
    expect(result.email).toEqual('guest@example.com');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.rsvp_status).toEqual('pending');
    expect(result.plus_one).toEqual(false);
    expect(result.wedding_id).toEqual(testWeddingId);
  });
});
