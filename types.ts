export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimate: string; // e.g., "2 days"
  priority: Priority;
  completed: boolean;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  title: string;
  goal: string;
  summary: string;
  phases: Phase[];
  risks: string[];
  createdAt: number;
}

export interface ProjectGenerationRequest {
  goal: string;
  context?: string;
}
