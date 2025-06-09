
import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Define ride type enum
export const rideTypeEnum = pgEnum('ride_type', ['commute', 'leisure', 'business', 'other']);

export const ridesTable = pgTable('rides', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  duration_minutes: numeric('duration_minutes', { precision: 10, scale: 2 }).notNull(),
  distance_km: numeric('distance_km', { precision: 10, scale: 3 }).notNull(),
  start_location: text('start_location').notNull(),
  end_location: text('end_location').notNull(),
  route_info: text('route_info'), // Nullable by default
  ride_type: rideTypeEnum('ride_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Ride = typeof ridesTable.$inferSelect; // For SELECT operations
export type NewRide = typeof ridesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { rides: ridesTable };
