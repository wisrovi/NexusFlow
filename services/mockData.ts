import { Project, Team, Worker, Task } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Migración Cloud', color: '#3b82f6', description: 'Migración de servidores a AWS' },
  { id: 'p2', name: 'Lanzamiento Q4', color: '#10b981', description: 'Campaña de marketing global' },
];

export const INITIAL_WORKERS: Worker[] = [
  { id: 'w1', name: 'Carlos Director', functionalRole: 'Director Técnico', intensity: 9, externalNotes: 'Alta performance', managerId: undefined },
  { id: 'w2', name: 'Ana Gerente', functionalRole: 'Project Manager', intensity: 8, externalNotes: 'Excelente gestión', managerId: 'w1' },
  { id: 'w3', name: 'Luis Dev', functionalRole: 'Senior Backend', intensity: 7, externalNotes: 'Necesita motivación', managerId: 'w2' },
  { id: 'w4', name: 'Sofia QA', functionalRole: 'QA Lead', intensity: 6, externalNotes: 'Muy detallista', managerId: 'w2' },
  { id: 'w5', name: 'Pedro Junior', functionalRole: 'Asistente Línea A', intensity: 4, externalNotes: 'En entrenamiento', managerId: 'w3' },
];

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', projectId: 'p1', name: 'Pareja Alpha', memberIds: ['w2', 'w3'] },
  { id: 't2', projectId: 'p1', name: 'Pareja Beta', memberIds: ['w3', 'w5'] },
  { id: 't3', projectId: 'p2', name: 'Equipo Creativo', memberIds: ['w4'] },
];

export const INITIAL_TASKS: Task[] = [
  { id: 'tsk1', title: 'Diseño de Arquitectura', workerId: 'w2', status: 'GREEN', teamId: 't1', projectId: 'p1' },
  { id: 'tsk2', title: 'Implementación API', workerId: 'w3', status: 'YELLOW', teamId: 't1', projectId: 'p1' },
  { 
    id: 'tsk3', 
    title: 'Testing Automatizado', 
    workerId: 'w4', 
    status: 'RED', 
    teamId: 't3', 
    projectId: 'p2',
    blockReason: 'Falta de entorno de pruebas configurado por soporte',
    blockedByWorkerId: 'w5' 
  },
];
