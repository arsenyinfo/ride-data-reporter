
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createRideInputSchema, 
  updateRideInputSchema,
  getRidesInputSchema,
  getMetricsInputSchema
} from './schema';
import { createRide } from './handlers/create_ride';
import { getRides } from './handlers/get_rides';
import { getRideById } from './handlers/get_ride_by_id';
import { updateRide } from './handlers/update_ride';
import { deleteRide } from './handlers/delete_ride';
import { getRideMetrics } from './handlers/get_ride_metrics';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new ride
  createRide: publicProcedure
    .input(createRideInputSchema)
    .mutation(({ input }) => createRide(input)),
  
  // Get rides with optional filtering
  getRides: publicProcedure
    .input(getRidesInputSchema.optional())
    .query(({ input }) => getRides(input)),
  
  // Get a specific ride by ID
  getRideById: publicProcedure
    .input(z.number())
    .query(({ input }) => getRideById(input)),
  
  // Update an existing ride
  updateRide: publicProcedure
    .input(updateRideInputSchema)
    .mutation(({ input }) => updateRide(input)),
  
  // Delete a ride
  deleteRide: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteRide(input)),
  
  // Get ride metrics and statistics
  getRideMetrics: publicProcedure
    .input(getMetricsInputSchema.optional())
    .query(({ input }) => getRideMetrics(input)),
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
