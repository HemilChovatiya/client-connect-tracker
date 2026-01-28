export type CollectorStatus = 'active' | 'traveling' | 'offline' | 'idle';

export interface Location {
  lat: number;
  lng: number;
  timestamp: Date;
  address?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  address: string;
  location: Location;
  phone: string;
  email: string;
  outstandingAmount: number;
}

export interface Task {
  id: string;
  clientId: string;
  client: Client;
  assignedTo: string;
  description: string;
  amountToCollect: number;
  amountCollected: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  financialYear: string;
}

export interface LocationHistory {
  location: Location;
  duration: number; // minutes spent
  clientVisited?: Client;
}

export interface Collector {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  email: string;
  status: CollectorStatus;
  currentLocation: Location;
  locationHistory: LocationHistory[];
  currentTask?: Task;
  totalCollected: number;
  tasksCompleted: number;
  financialYear: string;
}

export interface FinancialYear {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

export const FINANCIAL_YEARS: FinancialYear[] = [
  {
    id: 'FY2024-25',
    label: 'FY 2024-25',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
  },
  {
    id: 'FY2023-24',
    label: 'FY 2023-24',
    startDate: new Date('2023-04-01'),
    endDate: new Date('2024-03-31'),
  },
  {
    id: 'FY2022-23',
    label: 'FY 2022-23',
    startDate: new Date('2022-04-01'),
    endDate: new Date('2023-03-31'),
  },
];
