
import { db } from '../db';
import { budgetItemsTable } from '../db/schema';
import { type UpdateBudgetItemInput, type BudgetItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBudgetItem = async (input: UpdateBudgetItemInput): Promise<BudgetItem> => {
  try {
    // Build update values, only including fields that are provided
    const updateValues: Partial<typeof budgetItemsTable.$inferInsert> = {};
    
    if (input.category !== undefined) {
      updateValues.category = input.category;
    }
    if (input.item_name !== undefined) {
      updateValues.item_name = input.item_name;
    }
    if (input.estimated_cost !== undefined) {
      updateValues.estimated_cost = input.estimated_cost.toString();
    }
    if (input.actual_cost !== undefined) {
      updateValues.actual_cost = input.actual_cost !== null ? input.actual_cost.toString() : null;
    }
    if (input.paid !== undefined) {
      updateValues.paid = input.paid;
    }
    if (input.vendor !== undefined) {
      updateValues.vendor = input.vendor;
    }
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the budget item
    const result = await db.update(budgetItemsTable)
      .set(updateValues)
      .where(eq(budgetItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Budget item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const budgetItem = result[0];
    return {
      ...budgetItem,
      estimated_cost: parseFloat(budgetItem.estimated_cost),
      actual_cost: budgetItem.actual_cost ? parseFloat(budgetItem.actual_cost) : null
    };
  } catch (error) {
    console.error('Budget item update failed:', error);
    throw error;
  }
};
