
import { db } from '../db';
import { ridesTable } from '../db/schema';
import { type GetMetricsInput, type RideMetrics } from '../schema';
import { eq, gte, lte, and, sql, type SQL } from 'drizzle-orm';

export const getRideMetrics = async (input: GetMetricsInput = {}): Promise<RideMetrics> => {
  try {
    // Build conditions array for filtering
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

    // Execute aggregate query
    const aggregateResult = await db.select({
      total_rides: sql<number>`count(*)::int`,
      total_distance: sql<string>`sum(${ridesTable.distance_km})`,
      total_duration: sql<string>`sum(${ridesTable.duration_minutes})`,
      avg_distance: sql<string>`avg(${ridesTable.distance_km})`,
      avg_duration: sql<string>`avg(${ridesTable.duration_minutes})`
    })
    .from(ridesTable)
    .where(conditions.length === 0 ? sql`1=1` : (conditions.length === 1 ? conditions[0] : and(...conditions)))
    .execute();

    // Execute type count query
    const typeResults = await db.select({
      ride_type: ridesTable.ride_type,
      count: sql<number>`count(*)::int`
    })
    .from(ridesTable)
    .where(conditions.length === 0 ? sql`1=1` : (conditions.length === 1 ? conditions[0] : and(...conditions)))
    .groupBy(ridesTable.ride_type)
    .execute();

    // Build rides_by_type object
    const rides_by_type: Record<string, number> = {
      commute: 0,
      leisure: 0,
      business: 0,
      other: 0
    };

    typeResults.forEach(result => {
      rides_by_type[result.ride_type] = result.count;
    });

    // Handle null/zero cases and convert numeric fields
    const aggregateData = aggregateResult[0];
    const total_distance_km = aggregateData?.total_distance ? parseFloat(aggregateData.total_distance) : 0;
    const total_duration_minutes = aggregateData?.total_duration ? parseFloat(aggregateData.total_duration) : 0;
    const average_distance_km = aggregateData?.avg_distance ? parseFloat(aggregateData.avg_distance) : 0;
    const average_duration_minutes = aggregateData?.avg_duration ? parseFloat(aggregateData.avg_duration) : 0;

    return {
      total_rides: aggregateData?.total_rides || 0,
      total_distance_km,
      total_duration_minutes,
      average_distance_km,
      average_duration_minutes,
      rides_by_type
    };
  } catch (error) {
    console.error('Get ride metrics failed:', error);
    throw error;
  }
};
