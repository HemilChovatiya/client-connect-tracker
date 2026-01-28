import { Collector, Task } from '@/types/tracker';
import { formatDistanceToNow, format } from 'date-fns';
import { X, MapPin, Phone, Mail, Navigation, Clock, IndianRupee, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CollectorDetailProps {
  collector: Collector;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CollectorDetail = ({ collector, onClose }: CollectorDetailProps) => {
  const statusColors = {
    active: 'bg-status-active',
    traveling: 'bg-status-traveling',
    offline: 'bg-status-offline',
    idle: 'bg-status-idle',
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-slide-in h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-xl font-bold text-primary">
              {collector.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card',
                statusColors[collector.status]
              )}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{collector.name}</h2>
            <span className={cn('status-badge', `status-${collector.status}`)}>
              {collector.status}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {/* Contact Info */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4 text-primary" />
            <span>{collector.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4 text-primary" />
            <span>{collector.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{collector.currentLocation.address}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-lg font-bold text-status-active">
              {formatCurrency(collector.totalCollected)}
            </p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
            <p className="text-lg font-bold text-primary">{collector.tasksCompleted}</p>
          </div>
        </div>

        {/* Current Task */}
        {collector.currentTask && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Current Task
            </h3>
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {collector.currentTask.client.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {collector.currentTask.client.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {collector.currentTask.client.address}
                  </p>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount to Collect:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(collector.currentTask.amountToCollect)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Collected:</span>
                      <span className="font-semibold text-status-active">
                        {formatCurrency(collector.currentTask.amountCollected)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {collector.currentTask.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Location History
          </h3>
          <div className="space-y-3">
            {collector.locationHistory.map((history, index) => (
              <div
                key={index}
                className="relative pl-6 pb-3 border-l border-border last:border-l-transparent"
              >
                <div className="absolute left-0 top-0 w-3 h-3 -translate-x-1.5 rounded-full bg-primary" />
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {history.location.address}
                    </span>
                    {history.duration > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {history.duration} min
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(history.location.timestamp, 'hh:mm a')}
                  </p>
                  {history.clientVisited && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <p className="text-xs text-primary">
                        Visited: {history.clientVisited.companyName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
