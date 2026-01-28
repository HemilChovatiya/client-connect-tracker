import { Collector } from '@/types/tracker';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Phone, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectorCardProps {
  collector: Collector;
  isSelected: boolean;
  onClick: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CollectorCard = ({ collector, isSelected, onClick }: CollectorCardProps) => {
  const statusColors = {
    active: 'bg-status-active',
    traveling: 'bg-status-traveling',
    offline: 'bg-status-offline',
    idle: 'bg-status-idle',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]',
        isSelected && 'glow-border ring-1 ring-primary/50',
        'animate-fade-up'
      )}
      style={{ animationDelay: '0.1s' }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar with status indicator */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-lg font-bold text-primary">
            {collector.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card',
              statusColors[collector.status],
              collector.status === 'active' && 'animate-pulse'
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground truncate">{collector.name}</h3>
            <span className={cn('status-badge', `status-${collector.status}`)}>
              {collector.status}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{collector.currentLocation.address}</span>
          </div>

          {/* Current task info */}
          {collector.currentTask && (
            <div className="mt-2 p-2 rounded-md bg-secondary/50">
              <p className="text-xs font-medium text-foreground truncate">
                {collector.currentTask.client.companyName}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">To collect:</span>
                <span className="text-xs font-semibold text-primary">
                  {formatCurrency(collector.currentTask.amountToCollect)}
                </span>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1 text-status-active">
              <CheckCircle className="w-3 h-3" />
              <span>{collector.tasksCompleted} done</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(collector.currentLocation.timestamp, { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
