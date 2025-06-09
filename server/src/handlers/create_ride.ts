
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type CreateRideInput, type Ride } from '../schema';

export const createRide = async (input: CreateRideInput): Promise<Ride> => {
  try {
    // Calculate duration in minutes from start and end times
    const durationMinutes = Math.round((input.end_time.getTime() - input.start_time.getTime()) / (1000 * 60));

    // Insert ride record
    const result = await db.insert(ridesTable)
      .values({
        user_id: input.user_id,
        start_time: input.start_time,
        end_time: input.end_time,
        duration_minutes: durationMinutes.toString(), // Convert number to string for numeric column
        distance_km: input.distance_km.toString(), // Convert number to string for numeric column
        start_location: input.start_location,
        end_location: input.end_location,
        route_info: input.route_info || null,
        ride_type: input.ride_type
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const ride = result[0];
    return {
      ...ride,
      duration_minutes: parseFloat(ride.duration_minutes), // Convert string back to number
      distance_km: parseFloat(ride.distance_km) // Convert string back to number
    };
  } catch (error) {
    console.error('Ride creation failed:', error);
    throw error;
  }
};
