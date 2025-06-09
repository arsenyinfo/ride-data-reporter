
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type GetRidesInput, type Ride } from '../schema';
import { and, eq, gte, lte, desc, type SQL } from 'drizzle-orm';

export const getRides = async (input: GetRidesInput): Promise<Ride[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.user_id) {
      conditions.push(eq(ridesTable.user_id, input.user_id));
    }

    if (input.start_date) {
      conditions.push(gte(ridesTable.start_time, input.start_date));
    }

    if (input.end_date) {
      conditions.push(lte(ridesTable.start_time, input.end_date));
    }

    if (input.ride_type) {
      conditions.push(eq(ridesTable.ride_type, input.ride_type));
    }

    // Build and execute query
    const baseQuery = db.select().from(ridesTable);
    
    const queryWithConditions = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await queryWithConditions
      .orderBy(desc(ridesTable.start_time))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(ride => ({
      ...ride,
      duration_minutes: parseFloat(ride.duration_minutes),
      distance_km: parseFloat(ride.distance_km)
    }));
  } catch (error) {
    console.error('Failed to get rides:', error);
    throw error;
  }
};
