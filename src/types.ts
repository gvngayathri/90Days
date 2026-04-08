export type Category = 'job' | 'fitness' | 'yousquared';
export type Phase = 'Stabilize' | 'Build' | 'Convert';

export interface Task {
  id: string;
  title: string;
  notes: string;
  category: Category;
  date: string; // ISO format YYYY-MM-DD
  done: boolean;
  phase: Phase;
  userId?: string;
  order?: number;
}

export interface DashboardData {
  version: string;
  title: string;
  startDate: string;
  endDate: string;
  savedAt: string;
  tasks: Task[];
}
