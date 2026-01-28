import { useState, useMemo } from 'react';
import { MapView } from '@/components/MapView';
import { CollectorCard } from '@/components/CollectorCard';
import { CollectorDetail } from '@/components/CollectorDetail';
import { StatsOverview } from '@/components/StatsOverview';
import { mockCollectors, getSummaryStats } from '@/data/mockData';
import { FINANCIAL_YEARS } from '@/types/tracker';
import { Collector } from '@/types/tracker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Users, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [selectedYear, setSelectedYear] = useState('FY2024-25');
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const stats = useMemo(() => getSummaryStats(selectedYear), [selectedYear]);

  const filteredCollectors = useMemo(() => {
    return mockCollectors.filter(collector => {
      const matchesSearch = collector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collector.currentLocation.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || collector.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const handleRefresh = () => {
    // In real app, this would fetch new data
    console.log('Refreshing data...');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="glass-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">Collection Tracker</h1>
            <p className="text-xs text-muted-foreground">Real-time field force monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Financial Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px] bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINANCIAL_YEARS.map(fy => (
                  <SelectItem key={fy.id} value={fy.id}>
                    {fy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={handleRefresh} className="bg-secondary/50">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
        <StatsOverview stats={stats} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            'absolute top-4 z-20 p-2 rounded-r-lg bg-card border border-border border-l-0 transition-all duration-300',
            sidebarOpen ? 'left-[340px]' : 'left-0'
          )}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Collectors Sidebar */}
        <div
          className={cn(
            'w-[350px] border-r border-border bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300 z-10',
            !sidebarOpen && '-ml-[350px]'
          )}
        >
          {/* Search and Filters */}
          <div className="p-3 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collectors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'traveling', 'idle', 'offline'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Collectors List */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Collectors ({filteredCollectors.length})</span>
          </div>
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-3 space-y-3">
              {filteredCollectors.map(collector => (
                <CollectorCard
                  key={collector.id}
                  collector={collector}
                  isSelected={selectedCollector?.id === collector.id}
                  onClick={() => setSelectedCollector(
                    selectedCollector?.id === collector.id ? null : collector
                  )}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            collectors={filteredCollectors}
            selectedCollector={selectedCollector}
            onCollectorSelect={setSelectedCollector}
          />
        </div>

        {/* Collector Detail Panel */}
        {selectedCollector && (
          <div className="w-[380px] border-l border-border bg-card/50 backdrop-blur-sm">
            <CollectorDetail
              collector={selectedCollector}
              onClose={() => setSelectedCollector(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
