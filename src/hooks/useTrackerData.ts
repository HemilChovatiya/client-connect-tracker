import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collector, CollectorStatus, LocationHistory, Task, Client, Location } from '@/types/tracker';

// Transform DB client row to frontend Client type
const mapClient = (row: any): Client => ({
  id: row.id,
  name: row.name,
  companyName: row.company_name || '',
  address: row.address || '',
  location: {
    lat: row.latitude || 0,
    lng: row.longitude || 0,
    timestamp: new Date(row.updated_at),
  },
  phone: row.phone || '',
  email: row.email || '',
  outstandingAmount: Number(row.outstanding_amount) || 0,
});

// Transform DB task row to frontend Task type
const mapTask = (row: any, clients: Map<string, Client>): Task => ({
  id: row.id,
  clientId: row.client_id,
  client: clients.get(row.client_id) || {
    id: row.client_id,
    name: 'Unknown',
    companyName: 'Unknown',
    address: '',
    location: { lat: 0, lng: 0, timestamp: new Date() },
    phone: '',
    email: '',
    outstandingAmount: 0,
  },
  assignedTo: row.collector_id || '',
  description: row.description || '',
  amountToCollect: Number(row.amount_to_collect) || 0,
  amountCollected: Number(row.amount_collected) || 0,
  status: row.status === 'in_progress' ? 'in-progress' : row.status,
  createdAt: new Date(row.created_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  financialYear: row.financial_year_id,
});

export const useTrackerData = (financialYearId?: string) => {
  // Fetch clients
  const clientsQuery = useQuery({
    queryKey: ['tracker-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch financial years for the selector
  const financialYearsQuery = useQuery({
    queryKey: ['tracker-financial-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_years')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks
  const tasksQuery = useQuery({
    queryKey: ['tracker-tasks', financialYearId],
    queryFn: async () => {
      let query = supabase.from('tasks').select('*');
      if (financialYearId) {
        query = query.eq('financial_year_id', financialYearId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch collectors
  const collectorsQuery = useQuery({
    queryKey: ['tracker-collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch current locations for all collectors
  const locationsQuery = useQuery({
    queryKey: ['tracker-collector-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collector_locations')
        .select('*')
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch location history
  const historyQuery = useQuery({
    queryKey: ['tracker-location-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('location_history')
        .select('*')
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build transformed data
  const clientsMap = new Map<string, Client>();
  clientsQuery.data?.forEach(row => {
    clientsMap.set(row.id, mapClient(row));
  });

  const tasks: Task[] = (tasksQuery.data || []).map(row => mapTask(row, clientsMap));

  // Build collectors with all nested data
  const collectors: Collector[] = (collectorsQuery.data || []).map(row => {
    // Get latest location for this collector
    const latestLocation = locationsQuery.data?.find(l => l.collector_id === row.id);
    
    // Get location history
    const history: LocationHistory[] = (historyQuery.data || [])
      .filter(h => h.collector_id === row.id)
      .map(h => ({
        location: {
          lat: h.latitude,
          lng: h.longitude,
          timestamp: new Date(h.recorded_at),
          address: h.address || undefined,
        },
        duration: h.duration_minutes || 0,
        clientVisited: h.client_id ? clientsMap.get(h.client_id) : undefined,
      }));

    // Get current/active task for this collector
    const currentTask = tasks.find(
      t => t.assignedTo === row.id && (t.status === 'pending' || t.status === 'in-progress')
    );

    // Calculate stats
    const collectorTasks = tasks.filter(t => t.assignedTo === row.id);
    const totalCollected = collectorTasks.reduce((sum, t) => sum + t.amountCollected, 0);
    const tasksCompleted = collectorTasks.filter(t => t.status === 'completed').length;

    const currentLocation: Location = latestLocation
      ? {
          lat: latestLocation.latitude,
          lng: latestLocation.longitude,
          timestamp: new Date(latestLocation.recorded_at),
          address: latestLocation.address || undefined,
        }
      : {
          lat: 0,
          lng: 0,
          timestamp: new Date(),
          address: 'No location data',
        };

    return {
      id: row.id,
      name: row.name,
      avatar: undefined,
      phone: row.phone || '',
      email: row.email || '',
      status: (row.status as CollectorStatus) || 'offline',
      currentLocation,
      locationHistory: history,
      currentTask,
      totalCollected,
      tasksCompleted,
      financialYear: financialYearId || '',
    } as Collector;
  });

  // Calculate stats
  const stats = {
    totalCollectors: collectors.length,
    activeCollectors: collectors.filter(c => c.status === 'active' || c.status === 'traveling').length,
    totalCollected: collectors.reduce((sum, c) => sum + c.totalCollected, 0),
    pendingCollection: tasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.amountToCollect - t.amountCollected), 0),
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
  };

  const isLoading =
    clientsQuery.isLoading ||
    financialYearsQuery.isLoading ||
    tasksQuery.isLoading ||
    collectorsQuery.isLoading ||
    locationsQuery.isLoading ||
    historyQuery.isLoading;

  const refetchAll = () => {
    clientsQuery.refetch();
    tasksQuery.refetch();
    collectorsQuery.refetch();
    locationsQuery.refetch();
    historyQuery.refetch();
  };

  return {
    collectors,
    tasks,
    clients: Array.from(clientsMap.values()),
    financialYears: financialYearsQuery.data || [],
    stats,
    isLoading,
    refetchAll,
  };
};
