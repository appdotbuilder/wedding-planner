
import { db } from '../db';
import { budgetItemsTable } from '../db/schema';
import { type GetWeddingBudgetInput, type BudgetItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getWeddingBudget(input: GetWeddingBudgetInput): Promise<BudgetItem[]> {
  try {
    // Build the where condition
    const whereCondition = input.category 
      ? and(
          eq(budgetItemsTable.wedding_id, input.wedding_id),
          eq(budgetItemsTable.category, input.category)
        )
      : eq(budgetItemsTable.wedding_id, input.wedding_id);

    // Execute query
    const results = await db
      .select()
      .from(budgetItemsTable)
      .where(whereCondition)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      estimated_cost: parseFloat(item.estimated_cost),
      actual_cost: item.actual_cost ? parseFloat(item.actual_cost) : null
    }));
  } catch (error) {
    console.error('Failed to get wedding budget:', error);
    throw error;
  }
}
