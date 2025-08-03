
import { z } from 'zod';

// Wedding schema
export const weddingSchema = z.object({
  id: z.number(),
  title: z.string(),
  bride_name: z.string(),
  groom_name: z.string(),
  wedding_date: z.coerce.date(),
  venue: z.string().nullable(),
  description: z.string().nullable(),
  total_budget: z.number(),
  created_at: z.coerce.date()
});

export type Wedding = z.infer<typeof weddingSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  wedding_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Budget item schema
export const budgetItemSchema = z.object({
  id: z.number(),
  wedding_id: z.number(),
  category: z.string(),
  item_name: z.string(),
  estimated_cost: z.number(),
  actual_cost: z.number().nullable(),
  paid: z.boolean(),
  vendor: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

// Guest schema
export const guestSchema = z.object({
  id: z.number(),
  wedding_id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']),
  plus_one: z.boolean(),
  dietary_restrictions: z.string().nullable(),
  gift_description: z.string().nullable(),
  gift_value: z.number().nullable(),
  table_number: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type Guest = z.infer<typeof guestSchema>;

// Input schemas for creating
export const createWeddingInputSchema = z.object({
  title: z.string(),
  bride_name: z.string(),
  groom_name: z.string(),
  wedding_date: z.coerce.date(),
  venue: z.string().nullable(),
  description: z.string().nullable(),
  total_budget: z.number().nonnegative()
});

export type CreateWeddingInput = z.infer<typeof createWeddingInputSchema>;

export const createTaskInputSchema = z.object({
  wedding_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const createBudgetItemInputSchema = z.object({
  wedding_id: z.number(),
  category: z.string(),
  item_name: z.string(),
  estimated_cost: z.number().nonnegative(),
  actual_cost: z.number().nonnegative().nullable(),
  paid: z.boolean(),
  vendor: z.string().nullable(),
  notes: z.string().nullable()
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemInputSchema>;

export const createGuestInputSchema = z.object({
  wedding_id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  plus_one: z.boolean(),
  dietary_restrictions: z.string().nullable(),
  table_number: z.number().int().nullable()
});

export type CreateGuestInput = z.infer<typeof createGuestInputSchema>;

// Update schemas
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

export const updateBudgetItemInputSchema = z.object({
  id: z.number(),
  category: z.string().optional(),
  item_name: z.string().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  actual_cost: z.number().nonnegative().nullable().optional(),
  paid: z.boolean().optional(),
  vendor: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemInputSchema>;

export const updateGuestRsvpInputSchema = z.object({
  id: z.number(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']),
  dietary_restrictions: z.string().nullable().optional()
});

export type UpdateGuestRsvpInput = z.infer<typeof updateGuestRsvpInputSchema>;

export const updateGuestGiftInputSchema = z.object({
  id: z.number(),
  gift_description: z.string().nullable(),
  gift_value: z.number().nonnegative().nullable()
});

export type UpdateGuestGiftInput = z.infer<typeof updateGuestGiftInputSchema>;

// Query schemas
export const getWeddingTasksInputSchema = z.object({
  wedding_id: z.number(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export type GetWeddingTasksInput = z.infer<typeof getWeddingTasksInputSchema>;

export const getWeddingBudgetInputSchema = z.object({
  wedding_id: z.number(),
  category: z.string().optional()
});

export type GetWeddingBudgetInput = z.infer<typeof getWeddingBudgetInputSchema>;

export const getWeddingGuestsInputSchema = z.object({
  wedding_id: z.number(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']).optional()
});

export type GetWeddingGuestsInput = z.infer<typeof getWeddingGuestsInputSchema>;
