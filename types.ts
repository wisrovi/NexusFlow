export type Role = 'ADMIN' | 'READER';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface FunctionalRole {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  name: string;
  functionalRoles: string[]; // Changed to array to support multiple roles
  intensity: number; // 1-10
  externalNotes?: string; // Private to admin
  managerId?: string; // Hierarchy ID
  avatarUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string; // Hex code
  description?: string;
}

export interface Team {
  id: string;
  projectId: string;
  name: string; // "Pareja A", "Equipo Alpha"
  memberIds: string[];
}

export type TaskStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface Task {
  id: string;
  title: string;
  workerId: string; // Assigned worker
  status: TaskStatus;
  teamId: string;
  projectId: string;
  createdAt: string; // ISO Date String
  dueDate?: string; // ISO Date String
  // If RED:
  blockReason?: string;
  blockedByWorkerId?: string; // The sub-worker causing the block
}

// For the Graph Visualization
export interface GraphNode {
  name: string;
  type: 'ROOT' | 'PROJECT' | 'TEAM' | 'WORKER' | 'TASK';
  data?: any;
  children?: GraphNode[];
}