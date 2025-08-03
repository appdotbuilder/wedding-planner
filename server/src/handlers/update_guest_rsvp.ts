
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type UpdateGuestRsvpInput, type Guest } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateGuestRsvp(input: UpdateGuestRsvpInput): Promise<Guest> {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      rsvp_status: input.rsvp_status
    };

    // Only include dietary_restrictions if it's provided in the input
    if (input.dietary_restrictions !== undefined) {
      updateData.dietary_restrictions = input.dietary_restrictions;
    }

    // Update guest record
    const result = await db.update(guestsTable)
      .set(updateData)
      .where(eq(guestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Guest with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const guest = result[0];
    return {
      ...guest,
      gift_value: guest.gift_value ? parseFloat(guest.gift_value) : null
    };
  } catch (error) {
    console.error('Guest RSVP update failed:', error);
    throw error;
  }
}
