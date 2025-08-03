
import { db } from '../db';
import { weddingsTable } from '../db/schema';
import { type Wedding } from '../schema';

export const getWeddings = async (): Promise<Wedding[]> => {
  try {
    const results = await db.select()
      .from(weddingsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(wedding => ({
      ...wedding,
      total_budget: parseFloat(wedding.total_budget)
    }));
  } catch (error) {
    console.error('Failed to fetch weddings:', error);
    throw error;
  }
};
