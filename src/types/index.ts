export interface User {
  id: string;
  name: string;
  email: string;
  title: string;
  team: string;
  managerId: string | null;
  department: string;
  googleId?: string;
  profilePicture?: string;
  lastLogin?: number;
  createdAt: number;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  timestamp: number;
  appName: string;
  windowTitle: string;
  url?: string;
  category: ActivityCategory;
  keystrokesCount: number;
  mouseMovements: number;
  isIdle: boolean;
  mediaPlaying?: boolean;
  mediaSource?: string;
}

export enum ActivityCategory {
  DEEP = 'deep',
  SHALLOW = 'shallow',
  ADMIN = 'admin',
  DISTRACTED = 'distracted',
  IDLE = 'idle'
}

export interface ProductivityMetrics {
  userId: string;
  weekStart: number;
  weekEnd: number;
  totalHours: number;
  activeHours: number;
  deepWorkHours: number;
  shallowWorkHours: number;
  adminHours: number;
  unproductiveHours: number;
  idleHours: number;
  keystrokesPerHour: number;
  mouseMovementsPerHour: number;
  contextSwitchesPerHour: number;
  longestFocusSession: number;
  averageSessionLength: number;
  mediaHours: number;
  focusScore: number;
}

export interface AppUsage {
  appName: string;
  timeUsed: number;
  category: ActivityCategory;
  keystrokesCount: number;
  mouseMovements: number;
}

export interface WeeklyReport {
  user: User;
  week: { start: number; end: number };
  metrics: ProductivityMetrics;
  teamAverages: ProductivityMetrics;
  appUsage: AppUsage[];
  insights: Insight[];
  recommendations: string[];
}

export interface Insight {
  type: 'warning' | 'success' | 'info';
  message: string;
  delta?: number;
}

export interface TeamMetrics {
  teamName: string;
  averageFocusScore: number;
  totalDeepWorkHours: number;
  members: Array<{
    userId: string;
    name: string;
    focusScore: number;
    deepWorkHours: number;
  }>;
}

export interface Config {
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  team: string;
  department: string;
  managerId: string | null;
  trackingInterval: number; // milliseconds
  idleThreshold: number; // milliseconds
  serverUrl?: string; // If set, uses remote storage instead of local SQLite
  serverApiKey?: string; // API key for remote server authentication
  storageMode?: 'local' | 'remote'; // Explicitly set storage mode
}
