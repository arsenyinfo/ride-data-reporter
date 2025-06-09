
import { z } from 'zod';

// Ride schema
export const rideSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  duration_minutes: z.number(),
  distance_km: z.number(),
  start_location: z.string(),
  end_location: z.string(),
  route_info: z.string().nullable(),
  ride_type: z.enum(['commute', 'leisure', 'business', 'other']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Ride = z.infer<typeof rideSchema>;

// Input schema for creating rides
export const createRideInputSchema = z.object({
  user_id: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  distance_km: z.number().positive(),
  start_location: z.string(),
  end_location: z.string(),
  route_info: z.string().nullable().optional(),
  ride_type: z.enum(['commute', 'leisure', 'business', 'other'])
});

export type CreateRideInput = z.infer<typeof createRideInputSchema>;

// Input schema for updating rides
export const updateRideInputSchema = z.object({
  id: z.number(),
  user_id: z.string().optional(),
  start_time: z.coerce.date().optional(),
  end_time: z.coerce.date().optional(),
  distance_km: z.number().positive().optional(),
  start_location: z.string().optional(),
  end_location: z.string().optional(),
  route_info: z.string().nullable().optional(),
  ride_type: z.enum(['commute', 'leisure', 'business', 'other']).optional()
});

export type UpdateRideInput = z.infer<typeof updateRideInputSchema>;

// Query filters for rides
export const getRidesInputSchema = z.object({
  user_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  ride_type: z.enum(['commute', 'leisure', 'business', 'other']).optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0)
});

export type GetRidesInput = z.infer<typeof getRidesInputSchema>;

// Ride metrics schema
export const rideMetricsSchema = z.object({
  total_rides: z.number().int(),
  total_distance_km: z.number(),
  total_duration_minutes: z.number(),
  average_distance_km: z.number(),
  average_duration_minutes: z.number(),
  rides_by_type: z.record(z.enum(['commute', 'leisure', 'business', 'other']), z.number().int())
});

export type RideMetrics = z.infer<typeof rideMetricsSchema>;

// Date range input for metrics
export const getMetricsInputSchema = z.object({
  user_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type GetMetricsInput = z.infer<typeof getMetricsInputSchema>;
