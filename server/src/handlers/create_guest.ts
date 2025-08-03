
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type CreateGuestInput, type Guest } from '../schema';

export const createGuest = async (input: CreateGuestInput): Promise<Guest> => {
  try {
    // Insert guest record
    const result = await db.insert(guestsTable)
      .values({
        wedding_id: input.wedding_id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        plus_one: input.plus_one,
        dietary_restrictions: input.dietary_restrictions,
        table_number: input.table_number
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const guest = result[0];
    return {
      ...guest,
      gift_value: guest.gift_value ? parseFloat(guest.gift_value) : null
    };
  } catch (error) {
    console.error('Guest creation failed:', error);
    throw error;
  }
};
