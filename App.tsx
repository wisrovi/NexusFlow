import React, { useState, useEffect } from 'react';
import { 
  User, Role, Worker, Project, Team, Task, TaskStatus 
} from './types';
import { 
  INITIAL_PROJECTS, INITIAL_TEAMS, INITIAL_WORKERS, INITIAL_TASKS 
} from './services/mockData';
import { OrgChart } from './components/OrgChart';
import { 
  LayoutDashboard, Users, FolderKanban, LogOut, 
  AlertTriangle, CheckCircle, Clock, ChevronDown, Plus, Trash2, Shield, Menu,
  Pencil, X, Save
} from 'lucide-react';

// --- Components Helpers ---

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`} {...props}>{children}</div>
);

const Badge = ({ status }: { status: TaskStatus }) => {
  const styles = {
    GREEN: 'bg-green-100 text-green-700 border-green-200',
    YELLOW: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    RED: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
};

// --- MAIN APP ---

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // UI State
  const [view, setView] = useState<'DASHBOARD' | 'WORKERS' | 'PROJECTS'>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Auth Handlers ---
  const login = (role: Role) => {
    setCurrentUser({
      id: role === 'ADMIN' ? 'admin1' : 'reader1',
      username: role === 'ADMIN' ? 'Administrador' : 'Observador',
      role
    });
  };

  const logout = () => setCurrentUser(null);

  // --- CRUD Handlers (Admin Only) ---
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus, blockData?: { reason: string, blockedBy: string }) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: newStatus,
        blockReason: newStatus === 'RED' ? blockData?.reason : undefined,
        blockedByWorkerId: newStatus === 'RED' ? blockData?.blockedBy : undefined
      };
    }));
  };

  const addWorker = (worker: Worker) => setWorkers([...workers, worker]);
  const editWorker = (updatedWorker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
  };

  const addProject = (project: Project) => setProjects([...projects, project]);
  const editProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const addTask = (task: Task) => setTasks([...tasks, task]);
  const editTaskDetails = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  // --- Renders ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white">
               <Shield size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">NexusFlow</h1>
          <p className="text-slate-500 mb-8">Sistema de Diagnóstico Organizacional</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => login('ADMIN')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Users size={18} /> Acceder como Administrador
            </button>
            <button 
              onClick={() => login('READER')}
              className="w-full py-3 px-4 border-2 border-slate-200 hover:border-slate-400 text-slate-600 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={18} /> Acceder como Lector
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={`
          bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col 
          transition-all duration-300 ease-in-out z-20
          ${isSidebarOpen ? 'w-full md:w-64' : 'w-full md:w-20'}
          md:h-screen md:sticky md:top-0
        `}
      >
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-6 border-b border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-3 whitespace-nowrap overflow-hidden ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
          title={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
        >
          <div className="text-blue-500 min-w-[24px]">
            <Shield size={isSidebarOpen ? 24 : 28} />
          </div>
          <h2 className={`text-xl font-bold text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 block' : 'opacity-0 hidden md:hidden'}`}>
             NexusFlow
          </h2>
        </div>

        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-100'} ${!isSidebarOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className={`px-6 py-4 transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden'}`}>
             <div className="px-3 py-1 bg-slate-800 rounded-full text-xs inline-flex items-center gap-2 w-full overflow-hidden">
              <div className={`w-2 h-2 flex-shrink-0 rounded-full ${isAdmin ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="truncate">{currentUser.username}</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-hidden">
            <button 
              onClick={() => setView('DASHBOARD')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition overflow-hidden whitespace-nowrap 
                ${view === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}
                ${isSidebarOpen ? 'justify-start' : 'justify-center'}
              `}
              title="Dashboard"
            >
              <div className="min-w-[20px]"><LayoutDashboard size={20} /></div>
              <span className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Dashboard</span>
            </button>
            
            <button 
              onClick={() => setView('WORKERS')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition overflow-hidden whitespace-nowrap 
                ${view === 'WORKERS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}
                ${isSidebarOpen ? 'justify-start' : 'justify-center'}
              `}
              title="Trabajadores"
            >
              <div className="min-w-[20px]"><Users size={20} /></div>
              <span className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Trabajadores</span>
            </button>
            
            <button 
              onClick={() => setView('PROJECTS')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition overflow-hidden whitespace-nowrap 
                ${view === 'PROJECTS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}
                ${isSidebarOpen ? 'justify-start' : 'justify-center'}
              `}
              title="Proyectos"
            >
              <div className="min-w-[20px]"><FolderKanban size={20} /></div>
              <span className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Proyectos</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={logout} 
              className={`flex items-center gap-2 text-slate-400 hover:text-white transition w-full px-4 py-2 overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
              title="Cerrar Sesión"
            >
              <div className="min-w-[18px]"><LogOut size={18} /></div>
              <span className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {view === 'DASHBOARD' && 'Mapa de Diagnóstico'}
              {view === 'WORKERS' && 'Directorio de Personal'}
              {view === 'PROJECTS' && 'Gestión de Proyectos'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Vista activa: <span className="font-medium text-blue-600">{currentUser.role === 'ADMIN' ? 'Control Total' : 'Solo Lectura'}</span>
            </p>
          </div>
        </header>

        {/* Content Views */}
        
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-l-4 border-blue-500">
                <p className="text-sm text-slate-500">Proyectos Activos</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </Card>
              <Card className="p-4 border-l-4 border-red-500">
                <p className="text-sm text-slate-500">Bloqueos Críticos (ROJO)</p>
                <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'RED').length}</p>
              </Card>
              <Card className="p-4 border-l-4 border-green-500">
                <p className="text-sm text-slate-500">Personal Activo</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </Card>
            </div>

            <Card className="p-1 h-[600px] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Users size={18} /> Árbol de Colaboración</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">D3.js Visualization</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                 <OrgChart projects={projects} teams={teams} workers={workers} tasks={tasks} />
              </div>
            </Card>
          </div>
        )}

        {view === 'WORKERS' && (
          <WorkersView 
            isAdmin={isAdmin} 
            workers={workers} 
            addWorker={addWorker}
            editWorker={editWorker}
          />
        )}

        {view === 'PROJECTS' && (
          <ProjectsView 
            isAdmin={isAdmin} 
            projects={projects}
            teams={teams}
            tasks={tasks}
            workers={workers}
            updateTaskStatus={updateTaskStatus}
            addTask={addTask}
            editProject={editProject}
            editTaskDetails={editTaskDetails}
          />
        )}

      </main>
    </div>
  );
}

// --- SUB-VIEWS COMPONENTS ---

const WorkersView = ({ isAdmin, workers, addWorker, editWorker }: { isAdmin: boolean, workers: Worker[], addWorker: (w: Worker) => void, editWorker: (w: Worker) => void }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workerForm, setWorkerForm] = useState<Partial<Worker>>({ intensity: 5 });

  const startEdit = (worker: Worker) => {
    setWorkerForm({ ...worker });
    setEditingId(worker.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setWorkerForm({ intensity: 5 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name || !workerForm.functionalRole) return;

    const workerData: Worker = {
      id: editingId || `w${Date.now()}`,
      name: workerForm.name,
      functionalRole: workerForm.functionalRole,
      intensity: workerForm.intensity || 5,
      externalNotes: workerForm.externalNotes || '',
      managerId: workerForm.managerId,
      avatarUrl: workerForm.avatarUrl
    };

    if (editingId) {
      editWorker(workerData);
    } else {
      addWorker(workerData);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nuevo Trabajador</>}
          </button>
        </div>
      )}

      {showForm && isAdmin && (
        <Card className="p-6 bg-slate-50 border-blue-200 animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-lg mb-4 text-blue-900 border-b border-blue-100 pb-2">
            {editingId ? 'Editar Trabajador' : 'Registrar Nuevo Talento'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo</label>
              <input 
                className="w-full p-2 border rounded" 
                value={workerForm.name || ''} 
                onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol Funcional (Etiqueta)</label>
              <input 
                className="w-full p-2 border rounded" 
                placeholder="Ej: Consultor Senior"
                value={workerForm.functionalRole || ''} 
                onChange={e => setWorkerForm({...workerForm, functionalRole: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nivel Intensidad (1-10)</label>
              <input 
                type="range" min="1" max="10" 
                className="w-full"
                value={workerForm.intensity || 5} 
                onChange={e => setWorkerForm({...workerForm, intensity: parseInt(e.target.value)})}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Baja</span>
                <span className="font-bold text-blue-600">{workerForm.intensity}</span>
                <span>Alta</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jefe Directo (Jerarquía)</label>
              <select 
                className="w-full p-2 border rounded"
                value={workerForm.managerId || ''}
                onChange={e => setWorkerForm({...workerForm, managerId: e.target.value})}
              >
                <option value="">-- Sin Jefe Directo --</option>
                {workers.filter(w => w.id !== editingId).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notas de Impacto (Privado)</label>
              <textarea 
                className="w-full p-2 border rounded h-20"
                placeholder="Notas visibles solo para admin..."
                value={workerForm.externalNotes || ''} 
                onChange={e => setWorkerForm({...workerForm, externalNotes: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2">
                <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(worker => (
          <Card key={worker.id} className="p-4 hover:shadow-md transition group relative">
            {isAdmin && (
              <button 
                onClick={() => startEdit(worker)}
                className="absolute top-4 right-12 text-slate-400 hover:text-blue-600 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar Trabajador"
              >
                <Pencil size={16} />
              </button>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                    {worker.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800">{worker.name}</h3>
                    <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide mt-0.5">
                      {worker.functionalRole}
                    </span>
                 </div>
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs ${worker.intensity > 7 ? 'bg-red-500' : worker.intensity > 4 ? 'bg-blue-500' : 'bg-green-500'}`} title={`Intensidad: ${worker.intensity}`}>
                {worker.intensity}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 grid grid-cols-2 gap-2">
               <div>
                 <span className="text-[10px] uppercase font-bold text-slate-400 block">Reporta a</span> 
                 {workers.find(w => w.id === worker.managerId)?.name || 'N/A'}
               </div>
            </div>

            {isAdmin && worker.externalNotes && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-900 italic">
                <span className="font-bold not-italic">Nota:</span> {worker.externalNotes}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProjectsView = ({ isAdmin, projects, teams, tasks, workers, updateTaskStatus, addTask, editProject, editTaskDetails }: any) => {
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id);
  const [editingTaskStatus, setEditingTaskStatus] = useState<string | null>(null); // For status/block modal
  const [editingTaskDetailsId, setEditingTaskDetailsId] = useState<string | null>(null); // For title/assignee modal
  const [editingProject, setEditingProject] = useState<Project | null>(null); // For project modal
  
  // Status/Block State
  const [blockReason, setBlockReason] = useState('');
  const [blockerId, setBlockerId] = useState('');

  // Task Details Edit State
  const [tempTaskTitle, setTempTaskTitle] = useState('');
  const [tempTaskWorkerId, setTempTaskWorkerId] = useState('');

  // Project Edit State
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempProjectColor, setTempProjectColor] = useState('');

  const activeProject = projects.find((p: Project) => p.id === selectedProject);
  const projectTeams = teams.filter((t: Team) => t.projectId === selectedProject);

  // -- Handlers --

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (status === 'RED') {
      setEditingTaskStatus(taskId);
      setBlockReason('');
      setBlockerId('');
    } else {
      updateTaskStatus(taskId, status);
    }
  };

  const confirmBlock = () => {
    if (editingTaskStatus && blockReason && blockerId) {
      updateTaskStatus(editingTaskStatus, 'RED', { reason: blockReason, blockedBy: blockerId });
      setEditingTaskStatus(null);
    }
  };

  const openTaskEdit = (task: Task) => {
    setTempTaskTitle(task.title);
    setTempTaskWorkerId(task.workerId);
    setEditingTaskDetailsId(task.id);
  };

  const saveTaskEdit = () => {
    const task = tasks.find((t:Task) => t.id === editingTaskDetailsId);
    if (task && tempTaskTitle && tempTaskWorkerId) {
      editTaskDetails({ ...task, title: tempTaskTitle, workerId: tempTaskWorkerId });
      setEditingTaskDetailsId(null);
    }
  };

  const openProjectEdit = (project: Project) => {
    setEditingProject(project);
    setTempProjectName(project.name);
    setTempProjectColor(project.color);
  };

  const saveProjectEdit = () => {
    if (editingProject && tempProjectName && tempProjectColor) {
      editProject({ ...editingProject, name: tempProjectName, color: tempProjectColor });
      setEditingProject(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Project Tabs & Edit */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1 mr-4">
          {projects.map((p: Project) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p.id)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition border flex items-center gap-2 ${selectedProject === p.id ? 'bg-white shadow-md border-transparent text-slate-900 ring-1 ring-slate-100' : 'bg-transparent border-slate-300 text-slate-500 hover:bg-slate-100'}`}
              style={selectedProject === p.id ? { borderLeft: `4px solid ${p.color}` } : {}}
            >
              {p.name}
            </button>
          ))}
        </div>
        
        {isAdmin && activeProject && (
          <button 
            onClick={() => openProjectEdit(activeProject)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
          >
            <Pencil size={16} /> Editar Proyecto
          </button>
        )}
      </div>

      {/* Kanban Board style for Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projectTeams.map((team: Team) => (
          <div key={team.id} className="bg-slate-100 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-700">{team.name}</h3>
              <div className="flex -space-x-2">
                {team.memberIds.map(mid => {
                   const w = workers.find((w: Worker) => w.id === mid);
                   return w ? (
                     <div key={mid} className="w-6 h-6 rounded-full bg-slate-300 border border-white flex items-center justify-center text-[10px]" title={w.name}>
                        {w.name.charAt(0)}
                     </div>
                   ) : null;
                })}
              </div>
            </div>

            <div className="space-y-3">
              {tasks.filter((t: Task) => t.teamId === team.id).map((task: Task) => (
                <Card key={task.id} className={`p-3 border-l-4 group relative ${task.status === 'RED' ? 'border-l-red-500' : task.status === 'YELLOW' ? 'border-l-yellow-400' : 'border-l-green-500'}`}>
                  
                  {isAdmin && (
                    <button 
                       onClick={() => openTaskEdit(task)}
                       className="absolute top-2 right-2 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                       title="Editar Tarea"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  <div className="flex justify-between items-start mb-2 pr-6">
                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                    <Badge status={task.status} />
                  </div>
                  
                  <div className="text-xs text-slate-500 mb-2">
                    Asignado a: <span className="font-semibold text-slate-700">{workers.find((w: Worker) => w.id === task.workerId)?.name}</span>
                  </div>

                  {task.status === 'RED' && (
                    <div className="bg-red-50 p-2 rounded text-xs text-red-800 mb-2 border border-red-100">
                      <strong>Bloqueo:</strong> {task.blockReason}
                      <br />
                      <span className="opacity-75">Resp: {workers.find((w: Worker) => w.id === task.blockedByWorkerId)?.name || 'Unknown'}</span>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-1 justify-end mt-2 pt-2 border-t border-slate-100">
                      <button onClick={() => handleStatusChange(task.id, 'GREEN')} className="p-1 hover:bg-green-100 rounded text-green-600"><CheckCircle size={14}/></button>
                      <button onClick={() => handleStatusChange(task.id, 'YELLOW')} className="p-1 hover:bg-yellow-100 rounded text-yellow-600"><Clock size={14}/></button>
                      <button onClick={() => handleStatusChange(task.id, 'RED')} className="p-1 hover:bg-red-100 rounded text-red-600"><AlertTriangle size={14}/></button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Task Blocking Modal */}
      {editingTaskStatus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle /> Diagnóstico de Bloqueo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Causa del Bloqueo</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-red-200 outline-none"
                  rows={3}
                  placeholder="Describa por qué está detenida la tarea..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sub-trabajador Responsable / Bloqueante</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded"
                  value={blockerId}
                  onChange={(e) => setBlockerId(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {workers.map((w: Worker) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.functionalRole})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setEditingTaskStatus(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmBlock}
                  disabled={!blockReason || !blockerId}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Task Details Edit Modal */}
      {editingTaskDetailsId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Pencil size={20} /> Editar Detalles de Tarea
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título de la Tarea</label>
                <input 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                  value={tempTaskTitle}
                  onChange={(e) => setTempTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asignar a Trabajador</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded"
                  value={tempTaskWorkerId}
                  onChange={(e) => setTempTaskWorkerId(e.target.value)}
                >
                  {workers.map((w: Worker) => (
                    <option key={w.id} value={w.id}>{w.name} - {w.functionalRole}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setEditingTaskDetailsId(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveTaskEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. Project Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FolderKanban size={20} /> Editar Proyecto
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
                <input 
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Identificativo</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    className="w-12 h-12 p-1 rounded cursor-pointer"
                    value={tempProjectColor}
                    onChange={(e) => setTempProjectColor(e.target.value)}
                  />
                  <span className="text-sm text-slate-500 font-mono">{tempProjectColor}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveProjectEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar Proyecto
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};
