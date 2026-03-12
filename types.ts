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
  dependencies?: string[]; // Array of task IDs that must be completed before this task
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}

export interface Risk {
  id: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  likelihood: 'Low' | 'Medium' | 'High';
  mitigation: string;
}

export interface Project {
  id: string;
  title: string;
  goal: string;
  summary: string;
  phases: Phase[];
  risks: (string | Risk)[];
  createdAt: number;
}

export interface ProjectGenerationRequest {
  goal: string;
  context?: string;
}
