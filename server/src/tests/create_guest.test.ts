
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { guestsTable, weddingsTable } from '../db/schema';
import { type CreateGuestInput } from '../schema';
import { createGuest } from '../handlers/create_guest';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateGuestInput = {
  wedding_id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State',
  plus_one: true,
  dietary_restrictions: 'Vegetarian',
  table_number: 5
};

describe('createGuest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a guest', async () => {
    // Create wedding first (foreign key dependency)
    await db.insert(weddingsTable).values({
      title: 'Test Wedding',
      bride_name: 'Jane',
      groom_name: 'John',
      wedding_date: new Date(),
      total_budget: '10000.00'
    }).execute();

    const result = await createGuest(testInput);

    // Basic field validation
    expect(result.wedding_id).toEqual(1);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main St, City, State');
    expect(result.rsvp_status).toEqual('pending');
    expect(result.plus_one).toEqual(true);
    expect(result.dietary_restrictions).toEqual('Vegetarian');
    expect(result.gift_description).toBeNull();
    expect(result.gift_value).toBeNull();
    expect(result.table_number).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save guest to database', async () => {
    // Create wedding first
    await db.insert(weddingsTable).values({
      title: 'Test Wedding',
      bride_name: 'Jane',
      groom_name: 'John',
      wedding_date: new Date(),
      total_budget: '10000.00'
    }).execute();

    const result = await createGuest(testInput);

    // Query using proper drizzle syntax
    const guests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, result.id))
      .execute();

    expect(guests).toHaveLength(1);
    expect(guests[0].name).toEqual('John Doe');
    expect(guests[0].email).toEqual('john@example.com');
    expect(guests[0].phone).toEqual('+1234567890');
    expect(guests[0].plus_one).toEqual(true);
    expect(guests[0].rsvp_status).toEqual('pending');
    expect(guests[0].created_at).toBeInstanceOf(Date);
  });

  it('should create guest with minimal fields', async () => {
    // Create wedding first
    await db.insert(weddingsTable).values({
      title: 'Test Wedding',
      bride_name: 'Jane',
      groom_name: 'John',
      wedding_date: new Date(),
      total_budget: '10000.00'
    }).execute();

    const minimalInput: CreateGuestInput = {
      wedding_id: 1,
      name: 'Jane Smith',
      email: null,
      phone: null,
      address: null,
      plus_one: false,
      dietary_restrictions: null,
      table_number: null
    };

    const result = await createGuest(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.plus_one).toEqual(false);
    expect(result.dietary_restrictions).toBeNull();
    expect(result.table_number).toBeNull();
    expect(result.rsvp_status).toEqual('pending');
  });
});
