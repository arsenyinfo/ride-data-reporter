
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type CreateRideInput } from '../schema';
import { createRide } from '../handlers/create_ride';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateRideInput = {
  user_id: 'user-123',
  start_time: new Date('2024-01-01T10:00:00Z'),
  end_time: new Date('2024-01-01T10:30:00Z'),
  distance_km: 5.5,
  start_location: 'Home',
  end_location: 'Work',
  route_info: 'Via Main Street',
  ride_type: 'commute'
};

describe('createRide', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a ride with calculated duration', async () => {
    const result = await createRide(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user-123');
    expect(result.start_time).toEqual(testInput.start_time);
    expect(result.end_time).toEqual(testInput.end_time);
    expect(result.distance_km).toEqual(5.5);
    expect(result.start_location).toEqual('Home');
    expect(result.end_location).toEqual('Work');
    expect(result.route_info).toEqual('Via Main Street');
    expect(result.ride_type).toEqual('commute');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Duration should be calculated as 30 minutes (10:30 - 10:00)
    expect(result.duration_minutes).toEqual(30);
    expect(typeof result.duration_minutes).toEqual('number');
    expect(typeof result.distance_km).toEqual('number');
  });

  it('should save ride to database', async () => {
    const result = await createRide(testInput);

    // Query using proper drizzle syntax
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, result.id))
      .execute();

    expect(rides).toHaveLength(1);
    expect(rides[0].user_id).toEqual('user-123');
    expect(rides[0].start_time).toEqual(testInput.start_time);
    expect(rides[0].end_time).toEqual(testInput.end_time);
    expect(parseFloat(rides[0].distance_km)).toEqual(5.5);
    expect(parseFloat(rides[0].duration_minutes)).toEqual(30);
    expect(rides[0].start_location).toEqual('Home');
    expect(rides[0].end_location).toEqual('Work');
    expect(rides[0].route_info).toEqual('Via Main Street');
    expect(rides[0].ride_type).toEqual('commute');
    expect(rides[0].created_at).toBeInstanceOf(Date);
    expect(rides[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null route_info', async () => {
    const inputWithoutRoute: CreateRideInput = {
      ...testInput,
      route_info: null
    };

    const result = await createRide(inputWithoutRoute);

    expect(result.route_info).toBeNull();

    // Verify in database
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, result.id))
      .execute();

    expect(rides[0].route_info).toBeNull();
  });

  it('should calculate duration correctly for different time spans', async () => {
    const longRideInput: CreateRideInput = {
      ...testInput,
      start_time: new Date('2024-01-01T09:00:00Z'),
      end_time: new Date('2024-01-01T11:15:00Z') // 2 hours 15 minutes = 135 minutes
    };

    const result = await createRide(longRideInput);

    expect(result.duration_minutes).toEqual(135);
  });

  it('should handle different ride types', async () => {
    const leisureRideInput: CreateRideInput = {
      ...testInput,
      ride_type: 'leisure'
    };

    const result = await createRide(leisureRideInput);

    expect(result.ride_type).toEqual('leisure');

    // Verify in database
    const rides = await db.select()
      .from(ridesTable)
      .where(eq(ridesTable.id, result.id))
      .execute();

    expect(rides[0].ride_type).toEqual('leisure');
  });
});
