
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type UpdateGuestGiftInput, type Guest } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateGuestGift(input: UpdateGuestGiftInput): Promise<Guest> {
  try {
    // Update guest gift information
    const result = await db.update(guestsTable)
      .set({
        gift_description: input.gift_description,
        gift_value: input.gift_value ? input.gift_value.toString() : null
      })
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
    console.error('Guest gift update failed:', error);
    throw error;
  }
}
