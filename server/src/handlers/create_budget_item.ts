
import { db } from '../db';
import { budgetItemsTable, weddingsTable } from '../db/schema';
import { type CreateBudgetItemInput, type BudgetItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createBudgetItem = async (input: CreateBudgetItemInput): Promise<BudgetItem> => {
  try {
    // Verify wedding exists to prevent foreign key constraint violation
    const wedding = await db.select()
      .from(weddingsTable)
      .where(eq(weddingsTable.id, input.wedding_id))
      .execute();

    if (wedding.length === 0) {
      throw new Error('Wedding not found');
    }

    // Insert budget item record
    const result = await db.insert(budgetItemsTable)
      .values({
        wedding_id: input.wedding_id,
        category: input.category,
        item_name: input.item_name,
        estimated_cost: input.estimated_cost.toString(), // Convert number to string for numeric column
        actual_cost: input.actual_cost?.toString() || null, // Convert number to string for numeric column
        paid: input.paid,
        vendor: input.vendor,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budgetItem = result[0];
    return {
      ...budgetItem,
      estimated_cost: parseFloat(budgetItem.estimated_cost), // Convert string back to number
      actual_cost: budgetItem.actual_cost ? parseFloat(budgetItem.actual_cost) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Budget item creation failed:', error);
    throw error;
  }
};
