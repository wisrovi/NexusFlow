import { Project, Team, Worker, Task, FunctionalRole } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'Llamamientos', color: '#3b82f6', description: 'Gestión de llamamientos y relevos', memberIds: [] },
  { id: 'p2', name: 'Ministración', color: '#10b981', description: 'Supervisión de parejas de ministración', memberIds: [] },
  { id: 'p3', name: 'Autosuficiencia', color: '#f59e0b', description: 'Cursos y mentoria de autosuficiencia', memberIds: [] },
  { id: 'p4', name: 'Empleo', color: '#6366f1', description: 'Búsqueda y recursos de empleo', memberIds: [] },
  { id: 'p5', name: 'Recomendación Templo', color: '#8b5cf6', description: 'Seguimiento de entrevistas y vigencia', memberIds: [] },
  { id: 'p6', name: 'Bendición Patriarcal', color: '#ec4899', description: 'Solicitudes y recepciones', memberIds: [] },
];

export const INITIAL_FUNCTIONAL_ROLES: FunctionalRole[] = [
  { id: 'r1', name: 'Presidente de Quórum de Élderes' },
  { id: 'r2', name: 'Consejero de Quórum' },
  { id: 'r3', name: 'Secretario' },
  { id: 'r4', name: 'Instructor' },
  { id: 'r5', name: 'Líder de Ministración' },
  { id: 'r6', name: 'Especialista de Templo e Historia Familiar' },
  { id: 'r7', name: 'Miembro del Quórum' },
];

export const INITIAL_WORKERS: Worker[] = [
  { 
    id: 'w1', 
    name: 'William Rodriguez', 
    functionalRoles: ['Presidente de Quórum de Élderes'], 
    intensity: 10, 
    externalNotes: 'Líder principal', 
    managerId: undefined 
  }
];

// Start with empty teams and tasks as requested implicitly by resetting the context
export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_TASKS: Task[] = [];