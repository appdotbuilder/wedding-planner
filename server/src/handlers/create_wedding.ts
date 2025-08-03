
import { db } from '../db';
import { weddingsTable } from '../db/schema';
import { type CreateWeddingInput, type Wedding } from '../schema';

export const createWedding = async (input: CreateWeddingInput): Promise<Wedding> => {
  try {
    // Insert wedding record
    const result = await db.insert(weddingsTable)
      .values({
        title: input.title,
        bride_name: input.bride_name,
        groom_name: input.groom_name,
        wedding_date: input.wedding_date,
        venue: input.venue,
        description: input.description,
        total_budget: input.total_budget.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const wedding = result[0];
    return {
      ...wedding,
      total_budget: parseFloat(wedding.total_budget) // Convert string back to number
    };
  } catch (error) {
    console.error('Wedding creation failed:', error);
    throw error;
  }
};
