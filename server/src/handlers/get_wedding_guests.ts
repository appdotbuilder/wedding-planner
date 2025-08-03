
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type GetWeddingGuestsInput, type Guest } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getWeddingGuests(input: GetWeddingGuestsInput): Promise<Guest[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by wedding_id
    conditions.push(eq(guestsTable.wedding_id, input.wedding_id));

    // Optional RSVP status filter
    if (input.rsvp_status) {
      conditions.push(eq(guestsTable.rsvp_status, input.rsvp_status));
    }

    // Execute query with conditions
    const results = await db.select()
      .from(guestsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(guest => ({
      ...guest,
      gift_value: guest.gift_value ? parseFloat(guest.gift_value) : null
    }));
  } catch (error) {
    console.error('Failed to get wedding guests:', error);
    throw error;
  }
}
