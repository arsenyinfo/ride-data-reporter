
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Ride, RideMetrics, GetRidesInput } from '../../server/src/schema';

function App() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [metrics, setMetrics] = useState<RideMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<GetRidesInput>({
    user_id: '',
    ride_type: undefined,
    start_date: undefined,
    end_date: undefined,
    limit: 100,
    offset: 0
  });

  const loadRides = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clean up filters - remove empty strings and undefined values
      const cleanFilters: GetRidesInput = {
        limit: filters.limit,
        offset: filters.offset
      };
      
      if (filters.user_id && filters.user_id.trim()) {
        cleanFilters.user_id = filters.user_id.trim();
      }
      if (filters.ride_type) {
        cleanFilters.ride_type = filters.ride_type;
      }
      if (filters.start_date) {
        cleanFilters.start_date = filters.start_date;
      }
      if (filters.end_date) {
        cleanFilters.end_date = filters.end_date;
      }

      const result = await trpc.getRides.query(cleanFilters);
      setRides(result);
    } catch (error) {
      console.error('Failed to load rides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      // Use same filter criteria for metrics
      const metricsFilters = {
        user_id: filters.user_id && filters.user_id.trim() ? filters.user_id.trim() : undefined,
        start_date: filters.start_date,
        end_date: filters.end_date
      };

      const result = await trpc.getRideMetrics.query(metricsFilters);
      setMetrics(result);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsMetricsLoading(false);
    }
  }, [filters.user_id, filters.start_date, filters.end_date]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleApplyFilters = () => {
    loadRides();
    loadMetrics();
  };

  const handleResetFilters = () => {
    setFilters({
      user_id: '',
      ride_type: undefined,
      start_date: undefined,
      end_date: undefined,
      limit: 100,
      offset: 0
    });
  };

  const getRideTypeColor = (type: string) => {
    switch (type) {
      case 'commute': return 'bg-blue-100 text-blue-800';
      case 'leisure': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🚴 Ride Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track and analyze your cycling activities</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">📊 Overview & Metrics</TabsTrigger>
          <TabsTrigger value="rides">🚲 Detailed Rides</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Filters</CardTitle>
              <CardDescription>Filter your rides and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User ID</label>
                  <Input
                    placeholder="Enter user ID"
                    value={filters.user_id || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilters((prev: GetRidesInput) => ({ ...prev, user_id: e.target.value }))
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ride Type</label>
                  <Select
                    value={filters.ride_type || 'all'}
                    onValueChange={(value: string) =>
                      setFilters((prev: GetRidesInput) => ({
                        ...prev,
                        ride_type: value === 'all' ? undefined : value as 'commute' | 'leisure' | 'business' | 'other'
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="commute">🏢 Commute</SelectItem>
                      <SelectItem value="leisure">🌳 Leisure</SelectItem>
                      <SelectItem value="business">💼 Business</SelectItem>
                      <SelectItem value="other">📍 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={filters.start_date ? filters.start_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilters((prev: GetRidesInput) => ({
                        ...prev,
                        start_date: e.target.value ? new Date(e.target.value) : undefined
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={filters.end_date ? filters.end_date.toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilters((prev: GetRidesInput) => ({
                        ...prev,
                        end_date: e.target.value ? new Date(e.target.value) : undefined
                      }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters} disabled={isLoading || isMetricsLoading}>
                  {isLoading || isMetricsLoading ? 'Loading...' : 'Apply Filters'}
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                  <span className="text-2xl">🚴</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_rides}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                  <span className="text-2xl">📏</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.total_distance_km.toFixed(1)} km</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                  <span className="text-2xl">⏱️</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(metrics.total_duration_minutes)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Distance</CardTitle>
                  <span className="text-2xl">📊</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.average_distance_km.toFixed(1)} km</div>
                  <p className="text-xs text-muted-foreground">
                    Avg duration: {formatDuration(metrics.average_duration_minutes)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rides by Type */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>📈 Rides by Type</CardTitle>
                <CardDescription>Breakdown of your riding activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(metrics.rides_by_type).map(([type, count]) => (
                    <div key={type} className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold">{count}</div>
                      <Badge className={getRideTypeColor(type)} variant="secondary">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rides" className="space-y-6">
          {/* Rides Table */}
          <Card>
            <CardHeader>
              <CardTitle>🚲 Ride History</CardTitle>
              <CardDescription>
                Showing {rides.length} rides
                {filters.user_id && ` for user ${filters.user_id}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading rides...</div>
              ) : rides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rides found. Try adjusting your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Avg Speed</TableHead>
                        <TableHead>Route Info</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rides.map((ride: Ride) => (
                        <TableRow key={ride.id}>
                          <TableCell>
                            <div className="font-medium">
                              {ride.start_time.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {ride.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {ride.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRideTypeColor(ride.ride_type)} variant="secondary">
                              {ride.ride_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium text-sm truncate">{ride.start_location}</div>
                              <div className="text-xs text-muted-foreground">↓</div>
                              <div className="font-medium text-sm truncate">{ride.end_location}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {ride.distance_km.toFixed(1)} km
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatDuration(ride.duration_minutes)}
                          </TableCell>
                          <TableCell className="font-mono">
                            {(ride.distance_km / (ride.duration_minutes / 60)).toFixed(1)} km/h
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {ride.route_info ? (
                              <div className="text-sm text-muted-foreground truncate" title={ride.route_info}>
                                {ride.route_info}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No route info</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
