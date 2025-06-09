
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type CreateRideInput } from '../schema';
import { getRideById } from '../handlers/get_ride_by_id';

// Test ride data
const testRideData: Omit<CreateRideInput, 'start_time' | 'end_time'> & {
  start_time: Date;
  end_time: Date;
} = {
  user_id: 'user123',
  start_time: new Date('2024-01-15T08:00:00Z'),
  end_time: new Date('2024-01-15T08:30:00Z'),
  distance_km: 15.5,
  start_location: 'Downtown',
  end_location: 'Uptown',
  route_info: 'Main street route',
  ride_type: 'commute'
};

describe('getRideById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a ride when found', async () => {
    // Create a test ride
    const insertResult = await db.insert(ridesTable)
      .values({
        user_id: testRideData.user_id,
        start_time: testRideData.start_time,
        end_time: testRideData.end_time,
        duration_minutes: '30.00', // Convert to string for numeric column
        distance_km: testRideData.distance_km.toString(),
        start_location: testRideData.start_location,
        end_location: testRideData.end_location,
        route_info: testRideData.route_info,
        ride_type: testRideData.ride_type
      })
      .returning()
      .execute();

    const createdRide = insertResult[0];
    
    // Test the handler
    const result = await getRideById(createdRide.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdRide.id);
    expect(result!.user_id).toEqual('user123');
    expect(result!.start_time).toEqual(testRideData.start_time);
    expect(result!.end_time).toEqual(testRideData.end_time);
    expect(result!.duration_minutes).toEqual(30.00);
    expect(typeof result!.duration_minutes).toEqual('number');
    expect(result!.distance_km).toEqual(15.5);
    expect(typeof result!.distance_km).toEqual('number');
    expect(result!.start_location).toEqual('Downtown');
    expect(result!.end_location).toEqual('Uptown');
    expect(result!.route_info).toEqual('Main street route');
    expect(result!.ride_type).toEqual('commute');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ride not found', async () => {
    const result = await getRideById(999);
    expect(result).toBeNull();
  });

  it('should handle rides with null route_info', async () => {
    // Create a ride without route_info
    const insertResult = await db.insert(ridesTable)
      .values({
        user_id: testRideData.user_id,
        start_time: testRideData.start_time,
        end_time: testRideData.end_time,
        duration_minutes: '25.50',
        distance_km: testRideData.distance_km.toString(),
        start_location: testRideData.start_location,
        end_location: testRideData.end_location,
        route_info: null, // Explicitly null
        ride_type: 'leisure'
      })
      .returning()
      .execute();

    const createdRide = insertResult[0];
    const result = await getRideById(createdRide.id);

    expect(result).not.toBeNull();
    expect(result!.route_info).toBeNull();
    expect(result!.ride_type).toEqual('leisure');
    expect(result!.duration_minutes).toEqual(25.5);
    expect(typeof result!.duration_minutes).toEqual('number');
  });
});
