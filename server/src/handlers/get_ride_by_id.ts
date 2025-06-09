
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type Ride } from '../schema';
import { eq } from 'drizzle-orm';

export const getRideById = async (id: number): Promise<Ride | null> => {
  try {
    const result = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers
    const ride = result[0];
    return {
      ...ride,
      duration_minutes: parseFloat(ride.duration_minutes),
      distance_km: parseFloat(ride.distance_km)
    };
  } catch (error) {
    console.error('Get ride by ID failed:', error);
    throw error;
  }
};
