
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type UpdateRideInput } from '../schema';
import { updateRide } from '../handlers/update_ride';
import { eq } from 'drizzle-orm';

describe('updateRide', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test ride directly in database
  const createTestRide = async () => {
    const result = await db.insert(ridesTable)
      .values({
        user_id: 'user123',
        start_time: new Date('2024-01-01T10:00:00Z'),
        end_time: new Date('2024-01-01T10:30:00Z'),
        duration_minutes: '30',
        distance_km: '5.5',
        start_location: 'Home',
        end_location: 'Office',
        route_info: 'Main street route',
        ride_type: 'commute'
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update a ride with all fields', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      user_id: 'user456',
      start_time: new Date('2024-01-02T09:00:00Z'),
      end_time: new Date('2024-01-02T09:45:00Z'),
      distance_km: 7.2,
      start_location: 'New Home',
      end_location: 'New Office',
      route_info: 'Highway route',
      ride_type: 'business'
    };

    const result = await updateRide(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(createdRide.id);
    expect(result.user_id).toEqual('user456');
    expect(result.start_time).toEqual(new Date('2024-01-02T09:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-02T09:45:00Z'));
    expect(result.distance_km).toEqual(7.2);
    expect(result.start_location).toEqual('New Home');
    expect(result.end_location).toEqual('New Office');
    expect(result.route_info).toEqual('Highway route');
    expect(result.ride_type).toEqual('business');
    expect(result.duration_minutes).toEqual(45); // Calculated from time difference
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toEqual(createdRide.created_at);
  });

  it('should update only specified fields', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      distance_km: 8.0,
      ride_type: 'leisure'
    };

    const result = await updateRide(updateInput);

    // Verify only specified fields are updated
    expect(result.distance_km).toEqual(8.0);
    expect(result.ride_type).toEqual('leisure');
    
    // Verify other fields remain unchanged
    expect(result.user_id).toEqual('user123');
    expect(result.start_time).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-01T10:30:00Z'));
    expect(result.start_location).toEqual('Home');
    expect(result.end_location).toEqual('Office');
    expect(result.route_info).toEqual('Main street route');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdRide.updated_at!).toBe(true);
  });

  it('should save updated ride to database', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      distance_km: 10.5,
      ride_type: 'other'
    };

    await updateRide(updateInput);

    // Query database to verify changes
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, createdRide.id))
      .execute();

    expect(rides).toHaveLength(1);
    expect(parseFloat(rides[0].distance_km)).toEqual(10.5);
    expect(rides[0].ride_type).toEqual('other');
    expect(rides[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update route_info to null', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      route_info: null
    };

    const result = await updateRide(updateInput);

    expect(result.route_info).toBeNull();
  });

  it('should throw error for non-existent ride', async () => {
    const updateInput: UpdateRideInput = {
      id: 99999,
      distance_km: 5.0
    };

    await expect(updateRide(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should recalculate duration when both start and end times are updated', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      start_time: new Date('2024-01-03T14:00:00Z'),
      end_time: new Date('2024-01-03T15:30:00Z') // 90 minutes duration
    };

    const result = await updateRide(updateInput);

    expect(result.start_time).toEqual(new Date('2024-01-03T14:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-03T15:30:00Z'));
    expect(result.duration_minutes).toEqual(90);
  });

  it('should preserve existing duration when only one time is updated', async () => {
    // Create initial ride
    const createdRide = await createTestRide();

    const updateInput: UpdateRideInput = {
      id: createdRide.id,
      start_time: new Date('2024-01-03T14:00:00Z')
      // Only updating start_time, not end_time
    };

    const result = await updateRide(updateInput);

    expect(result.start_time).toEqual(new Date('2024-01-03T14:00:00Z'));
    expect(result.end_time).toEqual(new Date('2024-01-01T10:30:00Z')); // Original end_time
    expect(result.duration_minutes).toEqual(30); // Original duration preserved
  });
});
