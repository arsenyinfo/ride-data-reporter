
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type GetMetricsInput } from '../schema';
import { getRideMetrics } from '../handlers/get_ride_metrics';

describe('getRideMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero metrics when no rides exist', async () => {
    const result = await getRideMetrics();

    expect(result.total_rides).toEqual(0);
    expect(result.total_distance_km).toEqual(0);
    expect(result.total_duration_minutes).toEqual(0);
    expect(result.average_distance_km).toEqual(0);
    expect(result.average_duration_minutes).toEqual(0);
    expect(result.rides_by_type).toEqual({
      commute: 0,
      leisure: 0,
      business: 0,
      other: 0
    });
  });

  it('should calculate correct metrics for single ride', async () => {
    // Create test ride
    await db.insert(ridesTable).values({
      user_id: 'user1',
      start_time: new Date('2024-01-01T09:00:00Z'),
      end_time: new Date('2024-01-01T09:30:00Z'),
      duration_minutes: '30.5',
      distance_km: '15.25',
      start_location: 'Home',
      end_location: 'Work',
      ride_type: 'commute'
    }).execute();

    const result = await getRideMetrics();

    expect(result.total_rides).toEqual(1);
    expect(result.total_distance_km).toEqual(15.25);
    expect(result.total_duration_minutes).toEqual(30.5);
    expect(result.average_distance_km).toEqual(15.25);
    expect(result.average_duration_minutes).toEqual(30.5);
    expect(result.rides_by_type).toEqual({
      commute: 1,
      leisure: 0,
      business: 0,
      other: 0
    });
  });

  it('should calculate correct metrics for multiple rides', async () => {
    // Create multiple test rides
    await db.insert(ridesTable).values([
      {
        user_id: 'user1',
        start_time: new Date('2024-01-01T09:00:00Z'),
        end_time: new Date('2024-01-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '10',
        start_location: 'Home',
        end_location: 'Work',
        ride_type: 'commute'
      },
      {
        user_id: 'user1',
        start_time: new Date('2024-01-01T17:00:00Z'),
        end_time: new Date('2024-01-01T17:45:00Z'),
        duration_minutes: '45',
        distance_km: '20',
        start_location: 'Work',
        end_location: 'Home',
        ride_type: 'commute'
      },
      {
        user_id: 'user1',
        start_time: new Date('2024-01-02T14:00:00Z'),
        end_time: new Date('2024-01-02T15:30:00Z'),
        duration_minutes: '90',
        distance_km: '25',
        start_location: 'Home',
        end_location: 'Park',
        ride_type: 'leisure'
      }
    ]).execute();

    const result = await getRideMetrics();

    expect(result.total_rides).toEqual(3);
    expect(result.total_distance_km).toEqual(55); // 10 + 20 + 25
    expect(result.total_duration_minutes).toEqual(165); // 30 + 45 + 90
    expect(result.average_distance_km).toBeCloseTo(18.33, 2); // 55/3
    expect(result.average_duration_minutes).toEqual(55); // 165/3
    expect(result.rides_by_type).toEqual({
      commute: 2,
      leisure: 1,
      business: 0,
      other: 0
    });
  });

  it('should filter metrics by user_id', async () => {
    // Create rides for different users
    await db.insert(ridesTable).values([
      {
        user_id: 'user1',
        start_time: new Date('2024-01-01T09:00:00Z'),
        end_time: new Date('2024-01-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '10',
        start_location: 'Home',
        end_location: 'Work',
        ride_type: 'commute'
      },
      {
        user_id: 'user2',
        start_time: new Date('2024-01-01T10:00:00Z'),
        end_time: new Date('2024-01-01T10:30:00Z'),
        duration_minutes: '30',
        distance_km: '15',
        start_location: 'Home',
        end_location: 'Office',
        ride_type: 'business'
      }
    ]).execute();

    const input: GetMetricsInput = { user_id: 'user1' };
    const result = await getRideMetrics(input);

    expect(result.total_rides).toEqual(1);
    expect(result.total_distance_km).toEqual(10);
    expect(result.rides_by_type).toEqual({
      commute: 1,
      leisure: 0,
      business: 0,
      other: 0
    });
  });

  it('should filter metrics by date range', async () => {
    // Create rides on different dates
    await db.insert(ridesTable).values([
      {
        user_id: 'user1',
        start_time: new Date('2024-01-01T09:00:00Z'),
        end_time: new Date('2024-01-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '10',
        start_location: 'Home',
        end_location: 'Work',
        ride_type: 'commute'
      },
      {
        user_id: 'user1',
        start_time: new Date('2024-01-15T10:00:00Z'),
        end_time: new Date('2024-01-15T10:30:00Z'),
        duration_minutes: '30',
        distance_km: '15',
        start_location: 'Home',
        end_location: 'Work',
        ride_type: 'commute'
      },
      {
        user_id: 'user1',
        start_time: new Date('2024-02-01T11:00:00Z'),
        end_time: new Date('2024-02-01T11:30:00Z'),
        duration_minutes: '30',
        distance_km: '20',
        start_location: 'Home',
        end_location: 'Mall',
        ride_type: 'leisure'
      }
    ]).execute();

    const input: GetMetricsInput = {
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-31T23:59:59Z')
    };
    const result = await getRideMetrics(input);

    expect(result.total_rides).toEqual(2);
    expect(result.total_distance_km).toEqual(25); // 10 + 15
    expect(result.rides_by_type).toEqual({
      commute: 2,
      leisure: 0,
      business: 0,
      other: 0
    });
  });

  it('should combine user_id and date filters', async () => {
    const testDate = new Date('2024-01-01T09:00:00Z');
    
    // Create rides for different users and dates
    await db.insert(ridesTable).values([
      {
        user_id: 'user1',
        start_time: testDate,
        end_time: new Date('2024-01-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '10',
        start_location: 'Home',
        end_location: 'Work',
        ride_type: 'commute'
      },
      {
        user_id: 'user2',
        start_time: testDate,
        end_time: new Date('2024-01-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '15',
        start_location: 'Home',
        end_location: 'Office',
        ride_type: 'business'
      },
      {
        user_id: 'user1',
        start_time: new Date('2024-02-01T09:00:00Z'),
        end_time: new Date('2024-02-01T09:30:00Z'),
        duration_minutes: '30',
        distance_km: '20',
        start_location: 'Home',
        end_location: 'Park',
        ride_type: 'leisure'
      }
    ]).execute();

    const input: GetMetricsInput = {
      user_id: 'user1',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-31T23:59:59Z')
    };
    const result = await getRideMetrics(input);

    expect(result.total_rides).toEqual(1);
    expect(result.total_distance_km).toEqual(10);
    expect(result.rides_by_type).toEqual({
      commute: 1,
      leisure: 0,
      business: 0,
      other: 0
    });
  });
});
