import { Client, Collector, Task, Location } from '@/types/tracker';

// Ahmedabad city center coordinates
const AHMEDABAD_CENTER = { lat: 23.0225, lng: 72.5714 };

// Mock clients across Ahmedabad
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Rajesh Patel',
    companyName: 'Patel Industries Pvt Ltd',
    address: 'C.G. Road, Navrangpura, Ahmedabad',
    location: { lat: 23.0340, lng: 72.5560, timestamp: new Date() },
    phone: '+91 98765 43210',
    email: 'rajesh@patelindustries.com',
    outstandingAmount: 125000,
  },
  {
    id: 'client-2',
    name: 'Meera Shah',
    companyName: 'Shah Textiles',
    address: 'Ashram Road, Ahmedabad',
    location: { lat: 23.0250, lng: 72.5800, timestamp: new Date() },
    phone: '+91 98765 43211',
    email: 'meera@shahtextiles.com',
    outstandingAmount: 85000,
  },
  {
    id: 'client-3',
    name: 'Vikram Mehta',
    companyName: 'Mehta Electronics',
    address: 'Satellite Road, Ahmedabad',
    location: { lat: 23.0150, lng: 72.5100, timestamp: new Date() },
    phone: '+91 98765 43212',
    email: 'vikram@mehtaelectronics.com',
    outstandingAmount: 200000,
  },
  {
    id: 'client-4',
    name: 'Priya Desai',
    companyName: 'Desai Pharma',
    address: 'SG Highway, Ahmedabad',
    location: { lat: 23.0450, lng: 72.5200, timestamp: new Date() },
    phone: '+91 98765 43213',
    email: 'priya@desaipharma.com',
    outstandingAmount: 350000,
  },
  {
    id: 'client-5',
    name: 'Amit Joshi',
    companyName: 'Joshi Enterprises',
    address: 'Maninagar, Ahmedabad',
    location: { lat: 22.9950, lng: 72.6000, timestamp: new Date() },
    phone: '+91 98765 43214',
    email: 'amit@joshient.com',
    outstandingAmount: 175000,
  },
  {
    id: 'client-6',
    name: 'Neha Agarwal',
    companyName: 'Agarwal Trading Co',
    address: 'Paldi, Ahmedabad',
    location: { lat: 23.0100, lng: 72.5650, timestamp: new Date() },
    phone: '+91 98765 43215',
    email: 'neha@agarwaltrading.com',
    outstandingAmount: 95000,
  },
];

// Mock tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    clientId: 'client-1',
    client: mockClients[0],
    assignedTo: 'collector-1',
    description: 'Collect quarterly payment for Q3',
    amountToCollect: 125000,
    amountCollected: 0,
    status: 'in-progress',
    createdAt: new Date('2025-01-25'),
    financialYear: 'FY2024-25',
  },
  {
    id: 'task-2',
    clientId: 'client-2',
    client: mockClients[1],
    assignedTo: 'collector-1',
    description: 'Collect pending invoice #INV-2024-156',
    amountToCollect: 85000,
    amountCollected: 85000,
    status: 'completed',
    createdAt: new Date('2025-01-24'),
    completedAt: new Date('2025-01-25'),
    financialYear: 'FY2024-25',
  },
  {
    id: 'task-3',
    clientId: 'client-3',
    client: mockClients[2],
    assignedTo: 'collector-2',
    description: 'Collect payment for bulk order',
    amountToCollect: 200000,
    amountCollected: 0,
    status: 'pending',
    createdAt: new Date('2025-01-26'),
    financialYear: 'FY2024-25',
  },
  {
    id: 'task-4',
    clientId: 'client-4',
    client: mockClients[3],
    assignedTo: 'collector-2',
    description: 'Monthly subscription collection',
    amountToCollect: 350000,
    amountCollected: 175000,
    status: 'in-progress',
    createdAt: new Date('2025-01-20'),
    financialYear: 'FY2024-25',
  },
  {
    id: 'task-5',
    clientId: 'client-5',
    client: mockClients[4],
    assignedTo: 'collector-3',
    description: 'Collect advance payment',
    amountToCollect: 175000,
    amountCollected: 0,
    status: 'pending',
    createdAt: new Date('2025-01-27'),
    financialYear: 'FY2024-25',
  },
  {
    id: 'task-6',
    clientId: 'client-6',
    client: mockClients[5],
    assignedTo: 'collector-3',
    description: 'Final settlement for FY',
    amountToCollect: 95000,
    amountCollected: 95000,
    status: 'completed',
    createdAt: new Date('2025-01-22'),
    completedAt: new Date('2025-01-23'),
    financialYear: 'FY2024-25',
  },
];

// Mock collectors with location history
export const mockCollectors: Collector[] = [
  {
    id: 'collector-1',
    name: 'Arjun Sharma',
    avatar: undefined,
    phone: '+91 99876 54321',
    email: 'arjun.sharma@company.com',
    status: 'active',
    currentLocation: {
      lat: 23.0340,
      lng: 72.5560,
      timestamp: new Date(),
      address: 'C.G. Road, Navrangpura',
    },
    locationHistory: [
      {
        location: { lat: 23.0225, lng: 72.5714, timestamp: new Date(Date.now() - 3600000), address: 'Office HQ' },
        duration: 30,
      },
      {
        location: { lat: 23.0250, lng: 72.5800, timestamp: new Date(Date.now() - 2400000), address: 'Ashram Road' },
        duration: 45,
        clientVisited: mockClients[1],
      },
      {
        location: { lat: 23.0340, lng: 72.5560, timestamp: new Date(Date.now() - 1200000), address: 'C.G. Road' },
        duration: 0,
        clientVisited: mockClients[0],
      },
    ],
    currentTask: mockTasks[0],
    totalCollected: 285000,
    tasksCompleted: 12,
    financialYear: 'FY2024-25',
  },
  {
    id: 'collector-2',
    name: 'Kavita Reddy',
    avatar: undefined,
    phone: '+91 99876 54322',
    email: 'kavita.reddy@company.com',
    status: 'traveling',
    currentLocation: {
      lat: 23.0300,
      lng: 72.5150,
      timestamp: new Date(),
      address: 'Moving towards Satellite Road',
    },
    locationHistory: [
      {
        location: { lat: 23.0225, lng: 72.5714, timestamp: new Date(Date.now() - 5400000), address: 'Office HQ' },
        duration: 20,
      },
      {
        location: { lat: 23.0450, lng: 72.5200, timestamp: new Date(Date.now() - 3600000), address: 'SG Highway' },
        duration: 60,
        clientVisited: mockClients[3],
      },
    ],
    currentTask: mockTasks[2],
    totalCollected: 525000,
    tasksCompleted: 18,
    financialYear: 'FY2024-25',
  },
  {
    id: 'collector-3',
    name: 'Rahul Kumar',
    avatar: undefined,
    phone: '+91 99876 54323',
    email: 'rahul.kumar@company.com',
    status: 'idle',
    currentLocation: {
      lat: 22.9950,
      lng: 72.6000,
      timestamp: new Date(),
      address: 'Maninagar Office',
    },
    locationHistory: [
      {
        location: { lat: 23.0100, lng: 72.5650, timestamp: new Date(Date.now() - 7200000), address: 'Paldi' },
        duration: 55,
        clientVisited: mockClients[5],
      },
      {
        location: { lat: 22.9950, lng: 72.6000, timestamp: new Date(Date.now() - 3600000), address: 'Maninagar' },
        duration: 0,
      },
    ],
    currentTask: mockTasks[4],
    totalCollected: 390000,
    tasksCompleted: 15,
    financialYear: 'FY2024-25',
  },
  {
    id: 'collector-4',
    name: 'Sneha Patel',
    avatar: undefined,
    phone: '+91 99876 54324',
    email: 'sneha.patel@company.com',
    status: 'offline',
    currentLocation: {
      lat: 23.0500,
      lng: 72.5300,
      timestamp: new Date(Date.now() - 7200000),
      address: 'Last seen: Thaltej',
    },
    locationHistory: [
      {
        location: { lat: 23.0500, lng: 72.5300, timestamp: new Date(Date.now() - 7200000), address: 'Thaltej' },
        duration: 30,
      },
    ],
    currentTask: undefined,
    totalCollected: 180000,
    tasksCompleted: 8,
    financialYear: 'FY2024-25',
  },
];

// Summary statistics
export const getSummaryStats = (financialYear: string) => {
  const yearCollectors = mockCollectors.filter(c => c.financialYear === financialYear);
  const yearTasks = mockTasks.filter(t => t.financialYear === financialYear);

  return {
    totalCollectors: yearCollectors.length,
    activeCollectors: yearCollectors.filter(c => c.status === 'active' || c.status === 'traveling').length,
    totalCollected: yearCollectors.reduce((sum, c) => sum + c.totalCollected, 0),
    pendingCollection: yearTasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.amountToCollect - t.amountCollected), 0),
    completedTasks: yearTasks.filter(t => t.status === 'completed').length,
    pendingTasks: yearTasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
  };
};
