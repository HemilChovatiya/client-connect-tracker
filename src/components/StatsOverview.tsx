import { Users, UserCheck, IndianRupee, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatsCard = ({ title, value, icon, trend, variant = 'default' }: StatsCardProps) => {
  const variantStyles = {
    default: 'from-primary/10 to-primary/5 border-primary/20',
    success: 'from-status-active/10 to-status-active/5 border-status-active/20',
    warning: 'from-status-traveling/10 to-status-traveling/5 border-status-traveling/20',
    danger: 'from-status-offline/10 to-status-offline/5 border-status-offline/20',
  };

  const iconStyles = {
    default: 'text-primary',
    success: 'text-status-active',
    warning: 'text-status-traveling',
    danger: 'text-status-offline',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 bg-gradient-to-br border backdrop-blur-sm',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg bg-background/50', iconStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface StatsOverviewProps {
  stats: {
    totalCollectors: number;
    activeCollectors: number;
    totalCollected: number;
    pendingCollection: number;
    completedTasks: number;
    pendingTasks: number;
  };
}

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const StatsOverview = ({ stats }: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatsCard
        title="Total Collectors"
        value={stats.totalCollectors}
        icon={<Users className="w-5 h-5" />}
        variant="default"
      />
      <StatsCard
        title="Active Now"
        value={stats.activeCollectors}
        icon={<UserCheck className="w-5 h-5" />}
        trend={`${Math.round((stats.activeCollectors / stats.totalCollectors) * 100)}% online`}
        variant="success"
      />
      <StatsCard
        title="Total Collected"
        value={formatCurrency(stats.totalCollected)}
        icon={<IndianRupee className="w-5 h-5" />}
        variant="success"
      />
      <StatsCard
        title="Pending Amount"
        value={formatCurrency(stats.pendingCollection)}
        icon={<Clock className="w-5 h-5" />}
        variant="warning"
      />
      <StatsCard
        title="Tasks Done"
        value={stats.completedTasks}
        icon={<CheckCircle className="w-5 h-5" />}
        variant="success"
      />
      <StatsCard
        title="Pending Tasks"
        value={stats.pendingTasks}
        icon={<AlertCircle className="w-5 h-5" />}
        variant="warning"
      />
    </div>
  );
};
