
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type UpdateRideInput, type Ride } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRide = async (input: UpdateRideInput): Promise<Ride> => {
  try {
    // Calculate duration if both start_time and end_time are provided
    let duration_minutes: string | undefined;
    if (input.start_time && input.end_time) {
      const durationMs = input.end_time.getTime() - input.start_time.getTime();
      duration_minutes = (durationMs / (1000 * 60)).toString(); // Convert to minutes
    }

    // Build update values object, converting numeric fields to strings
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.user_id !== undefined) updateValues.user_id = input.user_id;
    if (input.start_time !== undefined) updateValues.start_time = input.start_time;
    if (input.end_time !== undefined) updateValues.end_time = input.end_time;
    if (input.distance_km !== undefined) updateValues.distance_km = input.distance_km.toString();
    if (input.start_location !== undefined) updateValues.start_location = input.start_location;
    if (input.end_location !== undefined) updateValues.end_location = input.end_location;
    if (input.route_info !== undefined) updateValues.route_info = input.route_info;
    if (input.ride_type !== undefined) updateValues.ride_type = input.ride_type;
    if (duration_minutes !== undefined) updateValues.duration_minutes = duration_minutes;

    // Update the ride record
    const result = await db.update(ridesTable)
      .set(updateValues)
      .where(eq(ridesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Ride with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const ride = result[0];
    return {
      ...ride,
      duration_minutes: parseFloat(ride.duration_minutes),
      distance_km: parseFloat(ride.distance_km)
    };
  } catch (error) {
    console.error('Ride update failed:', error);
    throw error;
  }
};
