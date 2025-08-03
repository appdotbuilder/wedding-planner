
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'attending', 'not_attending']);

// Weddings table
export const weddingsTable = pgTable('weddings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  bride_name: text('bride_name').notNull(),
  groom_name: text('groom_name').notNull(),
  wedding_date: timestamp('wedding_date').notNull(),
  venue: text('venue'),
  description: text('description'),
  total_budget: numeric('total_budget', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tasks table 
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  wedding_id: integer('wedding_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  due_date: timestamp('due_date'),
  completed: boolean('completed').notNull().default(false),
  priority: priorityEnum('priority').notNull().default('medium'),
  category: text('category'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Budget items table
export const budgetItemsTable = pgTable('budget_items', {
  id: serial('id').primaryKey(),
  wedding_id: integer('wedding_id').notNull(),
  category: text('category').notNull(),
  item_name: text('item_name').notNull(),
  estimated_cost: numeric('estimated_cost', { precision: 10, scale: 2 }).notNull(),
  actual_cost: numeric('actual_cost', { precision: 10, scale: 2 }),
  paid: boolean('paid').notNull().default(false),
  vendor: text('vendor'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Guests table
export const guestsTable = pgTable('guests', {
  id: serial('id').primaryKey(),
  wedding_id: integer('wedding_id').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  rsvp_status: rsvpStatusEnum('rsvp_status').notNull().default('pending'),
  plus_one: boolean('plus_one').notNull().default(false),
  dietary_restrictions: text('dietary_restrictions'),
  gift_description: text('gift_description'),
  gift_value: numeric('gift_value', { precision: 10, scale: 2 }),
  table_number: integer('table_number'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const weddingsRelations = relations(weddingsTable, ({ many }) => ({
  tasks: many(tasksTable),
  budgetItems: many(budgetItemsTable),
  guests: many(guestsTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  wedding: one(weddingsTable, {
    fields: [tasksTable.wedding_id],
    references: [weddingsTable.id],
  }),
}));

export const budgetItemsRelations = relations(budgetItemsTable, ({ one }) => ({
  wedding: one(weddingsTable, {
    fields: [budgetItemsTable.wedding_id],
    references: [weddingsTable.id],
  }),
}));

export const guestsRelations = relations(guestsTable, ({ one }) => ({
  wedding: one(weddingsTable, {
    fields: [guestsTable.wedding_id],
    references: [weddingsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Wedding = typeof weddingsTable.$inferSelect;
export type NewWedding = typeof weddingsTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;
export type BudgetItem = typeof budgetItemsTable.$inferSelect;
export type NewBudgetItem = typeof budgetItemsTable.$inferInsert;
export type Guest = typeof guestsTable.$inferSelect;
export type NewGuest = typeof guestsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  weddings: weddingsTable,
  tasks: tasksTable, 
  budgetItems: budgetItemsTable,
  guests: guestsTable
};
