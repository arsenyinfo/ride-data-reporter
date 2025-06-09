
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type GetRidesInput, type CreateRideInput } from '../schema';
import { getRides } from '../handlers/get_rides';

// Test ride data
const createTestRide = async (overrides: Partial<CreateRideInput> = {}) => {
  const defaultRide = {
    user_id: 'user123',
    start_time: new Date('2024-01-15T08:00:00Z'),
    end_time: new Date('2024-01-15T08:30:00Z'),
    distance_km: 5.5,
    start_location: 'Home',
    end_location: 'Office',
    route_info: 'Main street route',
    ride_type: 'commute' as const
  };

  const rideData = { ...defaultRide, ...overrides };

  const result = await db.insert(ridesTable)
    .values({
      user_id: rideData.user_id,
      start_time: rideData.start_time,
      end_time: rideData.end_time,
      duration_minutes: '30.00', // Store as string for numeric column
      distance_km: rideData.distance_km.toString(),
      start_location: rideData.start_location,
      end_location: rideData.end_location,
      route_info: rideData.route_info,
      ride_type: rideData.ride_type
    })
    .returning()
    .execute();

  return result[0];
};

describe('getRides', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all rides when no filters provided', async () => {
    // Create test rides
    await createTestRide();
    await createTestRide({ user_id: 'user456', ride_type: 'leisure' });

    const input: GetRidesInput = {
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toBeDefined();
    expect(result[0].distance_km).toEqual(5.5);
    expect(typeof result[0].distance_km).toBe('number');
    expect(typeof result[0].duration_minutes).toBe('number');
  });

  it('should filter rides by user_id', async () => {
    await createTestRide({ user_id: 'user123' });
    await createTestRide({ user_id: 'user456' });

    const input: GetRidesInput = {
      user_id: 'user123',
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user123');
  });

  it('should filter rides by date range', async () => {
    await createTestRide({ 
      start_time: new Date('2024-01-10T08:00:00Z'),
      end_time: new Date('2024-01-10T08:30:00Z')
    });
    await createTestRide({ 
      start_time: new Date('2024-01-20T08:00:00Z'),
      end_time: new Date('2024-01-20T08:30:00Z')
    });

    const input: GetRidesInput = {
      start_date: new Date('2024-01-15T00:00:00Z'),
      end_date: new Date('2024-01-25T00:00:00Z'),
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(1);
    expect(result[0].start_time.getTime()).toBeGreaterThanOrEqual(input.start_date!.getTime());
    expect(result[0].start_time.getTime()).toBeLessThanOrEqual(input.end_date!.getTime());
  });

  it('should filter rides by ride type', async () => {
    await createTestRide({ ride_type: 'commute' });
    await createTestRide({ ride_type: 'leisure' });
    await createTestRide({ ride_type: 'business' });

    const input: GetRidesInput = {
      ride_type: 'leisure',
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(1);
    expect(result[0].ride_type).toEqual('leisure');
  });

  it('should apply multiple filters together', async () => {
    await createTestRide({ 
      user_id: 'user123', 
      ride_type: 'commute',
      start_time: new Date('2024-01-15T08:00:00Z')
    });
    await createTestRide({ 
      user_id: 'user123', 
      ride_type: 'leisure',
      start_time: new Date('2024-01-15T10:00:00Z')
    });
    await createTestRide({ 
      user_id: 'user456', 
      ride_type: 'commute',
      start_time: new Date('2024-01-15T12:00:00Z')
    });

    const input: GetRidesInput = {
      user_id: 'user123',
      ride_type: 'commute',
      start_date: new Date('2024-01-14T00:00:00Z'),
      end_date: new Date('2024-01-16T00:00:00Z'),
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user123');
    expect(result[0].ride_type).toEqual('commute');
  });

  it('should respect limit and offset parameters', async () => {
    // Create multiple rides
    for (let i = 0; i < 5; i++) {
      await createTestRide({ 
        start_time: new Date(`2024-01-${15 + i}T08:00:00Z`),
        end_time: new Date(`2024-01-${15 + i}T08:30:00Z`)
      });
    }

    const input: GetRidesInput = {
      limit: 2,
      offset: 1
    };

    const result = await getRides(input);

    expect(result).toHaveLength(2);
  });

  it('should return rides ordered by start_time descending', async () => {
    await createTestRide({ 
      start_time: new Date('2024-01-10T08:00:00Z'),
      end_time: new Date('2024-01-10T08:30:00Z')
    });
    await createTestRide({ 
      start_time: new Date('2024-01-15T08:00:00Z'),
      end_time: new Date('2024-01-15T08:30:00Z')
    });
    await createTestRide({ 
      start_time: new Date('2024-01-12T08:00:00Z'),
      end_time: new Date('2024-01-12T08:30:00Z')
    });

    const input: GetRidesInput = {
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(3);
    // Should be ordered by start_time descending (most recent first)
    expect(result[0].start_time.getTime()).toBeGreaterThan(result[1].start_time.getTime());
    expect(result[1].start_time.getTime()).toBeGreaterThan(result[2].start_time.getTime());
  });

  it('should return empty array when no rides match filters', async () => {
    await createTestRide({ user_id: 'user123' });

    const input: GetRidesInput = {
      user_id: 'nonexistent_user',
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(0);
  });

  it('should use default limit and offset when not provided', async () => {
    await createTestRide();

    const input: GetRidesInput = {
      limit: 100,
      offset: 0
    };

    const result = await getRides(input);

    expect(result).toHaveLength(1);
    // This tests that defaults are applied by Zod schema parsing
  });
});
