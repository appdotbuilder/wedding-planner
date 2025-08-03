
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createWeddingInputSchema, 
  createTaskInputSchema,
  createBudgetItemInputSchema,
  createGuestInputSchema,
  updateTaskInputSchema,
  updateBudgetItemInputSchema,
  updateGuestRsvpInputSchema,
  updateGuestGiftInputSchema,
  getWeddingTasksInputSchema,
  getWeddingBudgetInputSchema,
  getWeddingGuestsInputSchema
} from './schema';

// Import handlers
import { createWedding } from './handlers/create_wedding';
import { getWeddings } from './handlers/get_weddings';
import { createTask } from './handlers/create_task';
import { getWeddingTasks } from './handlers/get_wedding_tasks';
import { updateTask } from './handlers/update_task';
import { createBudgetItem } from './handlers/create_budget_item';
import { getWeddingBudget } from './handlers/get_wedding_budget';
import { updateBudgetItem } from './handlers/update_budget_item';
import { createGuest } from './handlers/create_guest';
import { getWeddingGuests } from './handlers/get_wedding_guests';
import { updateGuestRsvp } from './handlers/update_guest_rsvp';
import { updateGuestGift } from './handlers/update_guest_gift';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Wedding management
  createWedding: publicProcedure
    .input(createWeddingInputSchema)
    .mutation(({ input }) => createWedding(input)),
  getWeddings: publicProcedure
    .query(() => getWeddings()),

  // Task management
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getWeddingTasks: publicProcedure
    .input(getWeddingTasksInputSchema)
    .query(({ input }) => getWeddingTasks(input)),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Budget management
  createBudgetItem: publicProcedure
    .input(createBudgetItemInputSchema)
    .mutation(({ input }) => createBudgetItem(input)),
  getWeddingBudget: publicProcedure
    .input(getWeddingBudgetInputSchema)
    .query(({ input }) => getWeddingBudget(input)),
  updateBudgetItem: publicProcedure
    .input(updateBudgetItemInputSchema)
    .mutation(({ input }) => updateBudgetItem(input)),

  // Guest management
  createGuest: publicProcedure
    .input(createGuestInputSchema)
    .mutation(({ input }) => createGuest(input)),
  getWeddingGuests: publicProcedure
    .input(getWeddingGuestsInputSchema)
    .query(({ input }) => getWeddingGuests(input)),
  updateGuestRsvp: publicProcedure
    .input(updateGuestRsvpInputSchema)
    .mutation(({ input }) => updateGuestRsvp(input)),
  updateGuestGift: publicProcedure
    .input(updateGuestGiftInputSchema)
    .mutation(({ input }) => updateGuestGift(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
