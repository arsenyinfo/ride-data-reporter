
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type CreateRideInput } from '../schema';
import { deleteRide } from '../handlers/delete_ride';
import { eq } from 'drizzle-orm';

// Test ride input
const testRideInput: CreateRideInput = {
  user_id: 'user123',
  start_time: new Date('2024-01-15T08:00:00Z'),
  end_time: new Date('2024-01-15T08:30:00Z'),
  distance_km: 5.5,
  start_location: 'Home',
  end_location: 'Office',
  route_info: 'Main street route',
  ride_type: 'commute'
};

describe('deleteRide', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing ride', async () => {
    // Create a test ride first
    const [createdRide] = await db.insert(ridesTable)
      .values({
        user_id: testRideInput.user_id,
        start_time: testRideInput.start_time,
        end_time: testRideInput.end_time,
        duration_minutes: '30.00', // Convert to string for numeric column
        distance_km: testRideInput.distance_km.toString(), // Convert to string
        start_location: testRideInput.start_location,
        end_location: testRideInput.end_location,
        route_info: testRideInput.route_info,
        ride_type: testRideInput.ride_type
      })
      .returning()
      .execute();

    // Delete the ride
    const result = await deleteRide(createdRide.id);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify ride is deleted from database
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, createdRide.id))
      .execute();

    expect(rides).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent ride', async () => {
    const nonExistentId = 99999;

    const result = await deleteRide(nonExistentId);

    // Should return false when no rows were affected
    expect(result).toBe(false);
  });

  it('should not affect other rides when deleting one ride', async () => {
    // Create two test rides
    const [ride1] = await db.insert(ridesTable)
      .values({
        user_id: testRideInput.user_id,
        start_time: testRideInput.start_time,
        end_time: testRideInput.end_time,
        duration_minutes: '30.00',
        distance_km: testRideInput.distance_km.toString(),
        start_location: testRideInput.start_location,
        end_location: testRideInput.end_location,
        route_info: testRideInput.route_info,
        ride_type: testRideInput.ride_type
      })
      .returning()
      .execute();

    const [ride2] = await db.insert(ridesTable)
      .values({
        user_id: 'user456',
        start_time: new Date('2024-01-16T09:00:00Z'),
        end_time: new Date('2024-01-16T09:45:00Z'),
        duration_minutes: '45.00',
        distance_km: '8.200',
        start_location: 'Park',
        end_location: 'Mall',
        route_info: null,
        ride_type: 'leisure'
      })
      .returning()
      .execute();

    // Delete the first ride
    const result = await deleteRide(ride1.id);

    expect(result).toBe(true);

    // Verify first ride is deleted
    const deletedRides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, ride1.id))
      .execute();

    expect(deletedRides).toHaveLength(0);

    // Verify second ride still exists
    const remainingRides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, ride2.id))
      .execute();

    expect(remainingRides).toHaveLength(1);
    expect(remainingRides[0].user_id).toEqual('user456');
  });
});
