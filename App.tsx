import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, Role, Worker, Project, Team, Task, TaskStatus, TaskStage, GraphNode, FunctionalRole
} from './types';
import { 
  INITIAL_PROJECTS, INITIAL_TEAMS, INITIAL_WORKERS, INITIAL_TASKS, INITIAL_FUNCTIONAL_ROLES
} from './services/mockData';
import { OrgChart } from './components/OrgChart';
import { 
  LayoutDashboard, Users, FolderKanban, LogOut, 
  AlertTriangle, CheckCircle, Clock, ChevronDown, Plus, Trash2, Shield, Menu,
  Pencil, X, Save, ClipboardList, Filter, Layers, Settings, UserPlus, Calendar, Sun, Moon, Info, Tag, Download, Bell, Globe, UserCheck, Github, Linkedin, Briefcase, Upload, StickyNote, User as UserIcon,
  LayoutList, LayoutGrid, Circle, ArrowRightCircle, CheckSquare
} from 'lucide-react';

// --- Components Helpers ---

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`} {...props}>{children}</div>
);

const Badge = ({ status }: { status: TaskStatus }) => {
  const styles = {
    GREEN: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    YELLOW: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    RED: 'bg-red-100 text-red-700 border-red-200 animate-pulse dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
};

// --- MODALS ---

const NodeDetailsModal = ({ node, onClose, data }: { node: GraphNode, onClose: () => void, data: { projects: Project[], teams: Team[], workers: Worker[], tasks: Task[] } }) => {
  if (!node || !node.data) return null;

  const { type, name } = node;
  const detailData = node.data;

  // Helper content renderers
  const renderContent = () => {
    if (type === 'PROJECT') {
      const proj = detailData as Project;
      const projTeams = data.teams.filter(t => t.projectId === proj.id);
      const projTasks = data.tasks.filter(t => t.projectId === proj.id);
      const directMembers = proj.memberIds?.length || 0;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: proj.color }}></div>
            <span className="text-sm text-slate-500">ID: {proj.id}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300">{proj.description}</p>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
             <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg text-center">
                <div className="text-xl font-bold">{directMembers}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase leading-tight">Miembros Asignados</div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg text-center">
                <div className="text-xl font-bold">{projTeams.length}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase leading-tight">Parejas</div>
             </div>
             <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg text-center">
                <div className="text-xl font-bold">{projTasks.length}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase leading-tight">Tareas Totales</div>
             </div>
          </div>
        </div>
      );
    }
    
    if (type === 'TEAM') {
      const team = detailData as Team;
      const members = team.memberIds.map(id => data.workers.find(w => w.id === id)).filter(Boolean);
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase text-slate-500">Miembros de la Pareja</h4>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m!.id} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700 rounded border dark:border-slate-600">
                 <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center font-bold text-xs">{m!.name.charAt(0)}</div>
                 <div>
                    <div className="font-medium text-sm">{m!.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{m!.functionalRoles.join(', ')}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'WORKER') {
      const worker = detailData as Worker;
      const activeTasks = data.tasks.filter(t => t.workerId === worker.id);
      return (
        <div className="space-y-4">
           <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="text-sm font-medium">Nivel de Intensidad</span>
              <span className={`font-bold ${worker.intensity > 7 ? 'text-red-500' : 'text-green-500'}`}>{worker.intensity}/10</span>
           </div>

           <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
             <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Roles / Llamamientos</span>
             <div className="flex flex-wrap gap-1">
               {worker.functionalRoles.map(r => (
                 <span key={r} className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">
                   {r}
                 </span>
               ))}
               {worker.functionalRoles.length === 0 && <span className="text-sm text-slate-400">Sin roles asignados</span>}
             </div>
           </div>
           
           <div>
              <h4 className="font-bold text-sm uppercase text-slate-500 mb-2">Tareas Asignadas ({activeTasks.length})</h4>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                 {activeTasks.map(t => (
                   <li key={t.id} className="text-sm p-2 border border-slate-100 dark:border-slate-600 rounded flex justify-between items-center">
                      <span className="truncate max-w-[150px]">{t.title}</span>
                      <Badge status={t.status} />
                   </li>
                 ))}
                 {activeTasks.length === 0 && <li className="text-sm text-slate-400 italic">Sin tareas activas.</li>}
              </ul>
           </div>
           
           {worker.managerId && (
             <div className="text-xs text-slate-400 mt-2">
               Reporta a: <span className="font-medium text-slate-600 dark:text-slate-300">{data.workers.find(w => w.id === worker.managerId)?.name}</span>
             </div>
           )}
        </div>
      );
    }

    if (type === 'TASK') {
      const task = detailData as Task;
      const assigned = data.workers.find(w => w.id === task.workerId);
      return (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Estado Diagnóstico:</span>
              <Badge status={task.status} />
           </div>

           <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Etapa:</span>
              <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 border dark:border-slate-600">
                {task.stage === 'TODO' && 'Por Hacer'}
                {task.stage === 'IN_PROGRESS' && 'En Progreso'}
                {task.stage === 'DONE' && 'Hecho'}
              </span>
           </div>
           
           {task.status === 'RED' && (
             <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                <strong className="block mb-1 flex items-center gap-1"><AlertTriangle size={14} /> Motivo de Bloqueo:</strong>
                {task.blockReason}
             </div>
           )}

           <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs">Responsable</span>
                <span className="font-medium">{assigned?.name}</span>
              </div>
              <div>
                <span className="block text-slate-500 text-xs">Vencimiento</span>
                <span className="font-medium">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
              </div>
           </div>

           {task.notes && (
             <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded">
                <strong className="block text-xs uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <StickyNote size={12} /> Notas:
                </strong>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.notes}</p>
             </div>
           )}
        </div>
      );
    }

    return <div>Información no disponible</div>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl">
         <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Info size={18} className="text-blue-500" />
              {type === 'WORKER' ? 'Ficha de Miembro' : 
               type === 'PROJECT' ? 'Detalles de Proyecto' :
               type === 'TEAM' ? 'Ficha de Pareja' : 'Detalles de Tarea'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={20} />
            </button>
         </div>
         <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{name}</h2>
            {renderContent()}
         </div>
         <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              Cerrar
            </button>
         </div>
      </Card>
    </div>
  );
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
  const [functionalRoles, setFunctionalRoles] = useState<FunctionalRole[]>(INITIAL_FUNCTIONAL_ROLES);

  // UI State
  const [view, setView] = useState<'DASHBOARD' | 'WORKERS' | 'PROJECTS' | 'TEAMS' | 'TASKS' | 'ROLES' | 'SETTINGS' | 'ABOUT'>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Graph Interaction State
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    // Force toggle dark mode on body/html
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
  const addWorker = (worker: Worker) => setWorkers([...workers, worker]);
  const editWorker = (updatedWorker: Worker) => {
    setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
  };

  const addProject = (project: Project) => setProjects([...projects, project]);
  const editProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const addTeam = (team: Team) => setTeams([...teams, team]);
  const updateTeam = (updatedTeam: Team) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const addTask = (task: Task) => setTasks([...tasks, task]);
  const editTaskDetails = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addRole = (role: FunctionalRole) => setFunctionalRoles([...functionalRoles, role]);
  const editRole = (updatedRole: FunctionalRole) => {
    setFunctionalRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
  };
  const deleteRole = (roleId: string) => {
    setFunctionalRoles(prev => prev.filter(r => r.id !== roleId));
  };

  const handleImportData = (data: any) => {
    try {
      if (data.projects) setProjects(data.projects);
      if (data.workers) setWorkers(data.workers);
      if (data.teams) setTeams(data.teams);
      if (data.tasks) setTasks(data.tasks);
      if (data.functionalRoles) setFunctionalRoles(data.functionalRoles);
      alert('Datos importados correctamente. El sistema se ha actualizado.');
    } catch (error) {
      console.error(error);
      alert('Error al importar los datos. Verifique el formato del archivo JSON.');
    }
  };

  // --- Renders ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 font-sans transition-colors duration-300">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
               <Shield size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">NexusFlow</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Sistema de Diagnóstico Organizacional</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => login('ADMIN')}
              className="w-full py-3 px-4 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Users size={18} /> Acceder como Administrador
            </button>
            <button 
              onClick={() => login('READER')}
              className="w-full py-3 px-4 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={18} /> Acceder como Lector
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-sm text-slate-400 flex items-center justify-center gap-2 w-full hover:text-slate-600 dark:hover:text-slate-200">
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />} {isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside 
        className={`
          bg-slate-900 dark:bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col 
          transition-all duration-300 ease-in-out z-20 border-r border-slate-800
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
             <div className="px-3 py-1 bg-slate-800 rounded-full text-xs inline-flex items-center gap-2 w-full overflow-hidden border border-slate-700">
              <div className={`w-2 h-2 flex-shrink-0 rounded-full ${isAdmin ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="truncate">{currentUser.username}</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-hidden overflow-y-auto">
            {/* 1. Dashboard */}
            <NavButton 
              active={view === 'DASHBOARD'} 
              onClick={() => setView('DASHBOARD')} 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              isOpen={isSidebarOpen} 
            />
            
            <div className="my-2 border-t border-slate-800 pt-2"></div>

            {/* 2. Projects */}
            <NavButton 
              active={view === 'PROJECTS'} 
              onClick={() => setView('PROJECTS')} 
              icon={<FolderKanban size={20} />} 
              label="Proyectos" 
              isOpen={isSidebarOpen} 
            />

            {/* 3. Roles */}
            <NavButton 
              active={view === 'ROLES'} 
              onClick={() => setView('ROLES')} 
              icon={<Tag size={20} />} 
              label="Roles y Llamamientos" 
              isOpen={isSidebarOpen} 
            />

            {/* 4. Members */}
            <NavButton 
              active={view === 'WORKERS'} 
              onClick={() => setView('WORKERS')} 
              icon={<UserPlus size={20} />} 
              label="Miembros" 
              isOpen={isSidebarOpen} 
            />

            {/* 5. Teams (Parejas) */}
            <NavButton 
              active={view === 'TEAMS'} 
              onClick={() => setView('TEAMS')} 
              icon={<Users size={20} />} 
              label="Parejas de Ministración" 
              isOpen={isSidebarOpen} 
            />

            {/* 6. Tasks */}
            <NavButton 
              active={view === 'TASKS'} 
              onClick={() => setView('TASKS')} 
              icon={<ClipboardList size={20} />} 
              label="Tareas" 
              isOpen={isSidebarOpen} 
            />
            
            <div className="my-2 border-t border-slate-800 pt-2"></div>

            {/* 7. Settings (Config) */}
             <NavButton 
              active={view === 'SETTINGS'} 
              onClick={() => setView('SETTINGS')} 
              icon={<Settings size={20} />} 
              label="Configuración" 
              isOpen={isSidebarOpen} 
            />

            {/* 8. About */}
             <NavButton 
              active={view === 'ABOUT'} 
              onClick={() => setView('ABOUT')} 
              icon={<Info size={20} />} 
              label="Acerca de" 
              isOpen={isSidebarOpen} 
            />
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {view === 'DASHBOARD' && 'Mapa de Diagnóstico'}
              {view === 'WORKERS' && 'Directorio de Miembros'}
              {view === 'PROJECTS' && 'Portafolio de Proyectos'}
              {view === 'TEAMS' && 'Parejas de Ministración'}
              {view === 'TASKS' && 'Gestión de Tareas'}
              {view === 'ROLES' && 'Gestión de Roles y Llamamientos'}
              {view === 'SETTINGS' && 'Configuración del Sistema'}
              {view === 'ABOUT' && 'Acerca del Creador'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Vista activa: <span className="font-medium text-blue-600 dark:text-blue-400">{currentUser.role === 'ADMIN' ? 'Control Total' : 'Solo Lectura'}</span>
            </p>
          </div>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition shadow-sm border border-slate-300 dark:border-slate-700"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Content Views */}
        
        {view === 'DASHBOARD' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-l-4 border-blue-500">
                <p className="text-sm text-slate-500 dark:text-slate-400">Proyectos Activos</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </Card>
              <Card className="p-4 border-l-4 border-red-500">
                <p className="text-sm text-slate-500 dark:text-slate-400">Bloqueos Críticos (ROJO)</p>
                <p className="text-2xl font-bold text-red-600">{tasks.filter(t => t.status === 'RED').length}</p>
              </Card>
              <Card className="p-4 border-l-4 border-green-500">
                <p className="text-sm text-slate-500 dark:text-slate-400">Miembros Activos</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </Card>
            </div>

            <Card className="p-1 h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Users size={18} /> Árbol de Colaboración</h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">Interactivo: Pulsa los Nodos</span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                 <OrgChart 
                   projects={projects} 
                   teams={teams} 
                   workers={workers} 
                   tasks={tasks}
                   onNodeClick={(node) => setSelectedNode(node)} 
                 />
              </div>
            </Card>
          </div>
        )}

        {view === 'WORKERS' && (
          <WorkersView 
            isAdmin={isAdmin} 
            workers={workers} 
            roles={functionalRoles}
            addWorker={addWorker}
            editWorker={editWorker}
          />
        )}

        {view === 'PROJECTS' && (
          <ProjectsView 
            isAdmin={isAdmin} 
            projects={projects}
            workers={workers}
            editProject={editProject}
            addProject={addProject}
          />
        )}

        {view === 'TEAMS' && (
          <TeamsView
            isAdmin={isAdmin}
            projects={projects}
            teams={teams}
            workers={workers}
            addTeam={addTeam}
            updateTeam={updateTeam}
          />
        )}

        {view === 'TASKS' && (
          <TasksView 
            isAdmin={isAdmin}
            tasks={tasks}
            projects={projects}
            teams={teams}
            workers={workers}
            addTask={addTask}
            editTask={editTaskDetails}
            deleteTask={deleteTask}
          />
        )}

        {view === 'ROLES' && (
          <RolesView 
            isAdmin={isAdmin}
            roles={functionalRoles}
            addRole={addRole}
            editRole={editRole}
            deleteRole={deleteRole}
          />
        )}

        {view === 'SETTINGS' && (
          <SettingsView 
            data={{ projects, teams, workers, tasks, functionalRoles }}
            onImport={handleImportData}
          />
        )}

        {view === 'ABOUT' && (
          <AboutView />
        )}

      </main>

      {/* GRAPH INTERACTION MODAL */}
      {selectedNode && (
        <NodeDetailsModal 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          data={{ projects, teams, workers, tasks }}
        />
      )}
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, isOpen }: any) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition overflow-hidden whitespace-nowrap 
      ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800'}
      ${isOpen ? 'justify-start' : 'justify-center'}
    `}
    title={label}
  >
    <div className="min-w-[20px]">{icon}</div>
    <span className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>{label}</span>
  </button>
);

// --- SUB-VIEWS COMPONENTS ---

const SettingsView = ({ data, onImport }: { data: any, onImport: (d: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `NexusFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const json = JSON.parse(event.target.result as string);
          onImport(json);
        }
      } catch (err) {
        alert("El archivo no es un JSON válido.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
          <Settings size={24} className="text-slate-400" />
          Preferencias Generales
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
             <div className="flex items-center gap-3">
                <Globe size={20} className="text-slate-500" />
                <div>
                   <p className="font-medium">Idioma de la Interfaz</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona el idioma predeterminado</p>
                </div>
             </div>
             <select className="bg-white dark:bg-slate-800 border dark:border-slate-600 rounded p-1 text-sm outline-none">
                <option>Español</option>
                <option>English</option>
             </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
             <div className="flex items-center gap-3">
                <Bell size={20} className="text-slate-500" />
                <div>
                   <p className="font-medium">Notificaciones de Sistema</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Alertas sobre bloqueos y tareas</p>
                </div>
             </div>
             <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-green-400"/>
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-blue-100 dark:border-blue-900">
         <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Download size={24} className="text-blue-500" />
            Copia de Seguridad
         </h3>
         <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
           Gestiona los datos de tu organización. Puedes exportar una copia completa en JSON para resguardo o importar datos desde otro dispositivo.
         </p>
         <div className="flex gap-4">
           <button 
             onClick={handleExport}
             className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg transition transform hover:-translate-y-0.5"
           >
              <Download size={18} /> Exportar Datos JSON
           </button>
           
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept=".json"
             onChange={handleFileChange}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium flex items-center gap-2 shadow-sm transition transform hover:-translate-y-0.5"
           >
              <Upload size={18} /> Importar Datos
           </button>
         </div>
      </Card>
    </div>
  );
};

const AboutView = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
           <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 bg-white shadow-xl overflow-hidden flex items-center justify-center">
                 {/* Placeholder for Profile Image if not available */}
                 <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                    <UserCheck size={48} />
                 </div>
              </div>
           </div>
        </div>
        <div className="pt-20 pb-8 px-8">
           <h2 className="text-3xl font-bold text-slate-900 dark:text-white">William Rodriguez (Wisrovi)</h2>
           <p className="text-blue-600 dark:text-blue-400 font-medium text-lg mb-6">Full Stack Developer & System Architect</p>
           
           <div className="space-y-6 text-slate-600 dark:text-slate-300">
              <p>
                Creador de <strong>NexusFlow</strong>, una solución diseñada para optimizar la gestión de diagnósticos organizacionales y visualización de jerarquías complejas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <a 
                   href="https://es.linkedin.com/in/wisrovi-rodriguez" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group"
                 >
                    <div className="p-2 bg-[#0077b5] text-white rounded-lg">
                       <Linkedin size={24} />
                    </div>
                    <div>
                       <span className="block font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">LinkedIn Profile</span>
                       <span className="text-xs">Conectar profesionalmente</span>
                    </div>
                 </a>

                 <a 
                   href="#" 
                   className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group"
                 >
                    <div className="p-2 bg-slate-900 text-white rounded-lg">
                       <Github size={24} />
                    </div>
                    <div>
                       <span className="block font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">GitHub Portfolio</span>
                       <span className="text-xs">Ver proyectos de código</span>
                    </div>
                 </a>
              </div>

              <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                 <h4 className="font-bold flex items-center gap-2 mb-3">
                    <Briefcase size={18} /> Skills & Expertise
                 </h4>
                 <div className="flex flex-wrap gap-2">
                    {['React', 'TypeScript', 'Tailwind CSS', 'D3.js', 'System Architecture', 'UI/UX Design'].map(skill => (
                      <span key={skill} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400">
                        {skill}
                      </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </Card>
      
      <div className="text-center mt-8 text-slate-400 text-sm">
         &copy; {new Date().getFullYear()} NexusFlow. Developed by Wisrovi.
      </div>
    </div>
  );
};

const RolesView = ({ isAdmin, roles, addRole, editRole, deleteRole }: { isAdmin: boolean, roles: FunctionalRole[], addRole: (r: FunctionalRole) => void, editRole: (r: FunctionalRole) => void, deleteRole: (id: string) => void }) => {
  const [editingRole, setEditingRole] = useState<FunctionalRole | null>(null);
  const [roleName, setRoleName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    if (editingRole) {
      editRole({ ...editingRole, name: roleName });
      setEditingRole(null);
    } else {
      addRole({ id: `role${Date.now()}`, name: roleName });
    }
    setRoleName('');
  };

  const startEdit = (role: FunctionalRole) => {
    setEditingRole(role);
    setRoleName(role.name);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setRoleName('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {isAdmin ? (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
            {editingRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h3>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input 
              className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 outline-none"
              placeholder="Nombre del Rol / Llamamiento (ej: Presidente de Quórum)"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
            />
            {editingRole && (
              <button type="button" onClick={cancelEdit} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                Cancelar
              </button>
            )}
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm transition">
              {editingRole ? 'Actualizar' : 'Agregar Rol'}
            </button>
          </form>
        </Card>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 p-4 rounded-lg flex items-center gap-2">
          <Info size={20} />
          <span>Vista de solo lectura. Solo el administrador puede gestionar los roles.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <Card key={role.id} className="p-4 flex justify-between items-center hover:shadow-md transition group">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                 <Tag size={18} />
               </div>
               <span className="font-medium text-slate-700 dark:text-slate-200">{role.name}</span>
            </div>
            {isAdmin && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(role)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-600">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteRole(role.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const WorkersView = ({ isAdmin, workers, roles, addWorker, editWorker }: { isAdmin: boolean, workers: Worker[], roles: FunctionalRole[], addWorker: (w: Worker) => void, editWorker: (w: Worker) => void }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workerForm, setWorkerForm] = useState<Partial<Worker>>({ intensity: 5, functionalRoles: [] });

  const startEdit = (worker: Worker) => {
    setWorkerForm({ ...worker });
    setEditingId(worker.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setWorkerForm({ intensity: 5, functionalRoles: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleRole = (roleName: string) => {
    setWorkerForm(prev => {
      const currentRoles = prev.functionalRoles || [];
      if (currentRoles.includes(roleName)) {
        return { ...prev, functionalRoles: currentRoles.filter(r => r !== roleName) };
      } else {
        return { ...prev, functionalRoles: [...currentRoles, roleName] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.name) return;

    const workerData: Worker = {
      id: editingId || `w${Date.now()}`,
      name: workerForm.name,
      functionalRoles: workerForm.functionalRoles || [],
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
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${showForm ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nuevo Miembro</>}
          </button>
        </div>
      )}

      {showForm && isAdmin && (
        <Card className="p-6 bg-slate-50 dark:bg-slate-800/50 border-blue-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-lg mb-4 text-blue-900 dark:text-blue-400 border-b border-blue-100 dark:border-slate-700 pb-2">
            {editingId ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre Completo</label>
              <input 
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 outline-none" 
                value={workerForm.name || ''} 
                onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
                required
              />
            </div>
            
            <div className="row-span-2">
              <label className="block text-sm font-medium mb-1">Roles / Llamamientos (Selección Múltiple)</label>
              <div className="max-h-48 overflow-y-auto border rounded p-2 dark:bg-slate-700 dark:border-slate-600 space-y-1">
                 {roles.map(role => (
                   <label key={role.id} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(workerForm.functionalRoles || []).includes(role.name)}
                        onChange={() => toggleRole(role.name)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{role.name}</span>
                   </label>
                 ))}
                 {roles.length === 0 && <span className="text-sm text-slate-400">No hay roles definidos. Ve a la vista de Roles para crear uno.</span>}
              </div>
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
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 outline-none"
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
                className="w-full p-2 border rounded h-20 dark:bg-slate-700 dark:border-slate-600 outline-none"
                placeholder="Notas visibles solo para admin..."
                value={workerForm.externalNotes || ''} 
                onChange={e => setWorkerForm({...workerForm, externalNotes: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2">
                <Save size={18} /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(worker => (
          <Card key={worker.id} className="p-4 hover:shadow-md transition group relative dark:bg-slate-800">
            {isAdmin && (
              <button 
                onClick={() => startEdit(worker)}
                className="absolute top-4 right-12 text-slate-400 hover:text-blue-600 p-1 bg-white/80 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                title="Editar Miembro"
              >
                <Pencil size={16} />
              </button>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                    {worker.name.charAt(0)}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{worker.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {worker.functionalRoles.slice(0, 2).map(r => (
                        <span key={r} className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          {r}
                        </span>
                      ))}
                      {worker.functionalRoles.length > 2 && (
                         <span className="text-[10px] text-slate-400">+{worker.functionalRoles.length - 2}</span>
                      )}
                    </div>
                 </div>
              </div>
              <div className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs ${worker.intensity > 7 ? 'bg-red-500' : worker.intensity > 4 ? 'bg-blue-500' : 'bg-green-500'}`} title={`Intensidad: ${worker.intensity}`}>
                {worker.intensity}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 grid grid-cols-2 gap-2">
               <div>
                 <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Reporta a</span> 
                 {workers.find(w => w.id === worker.managerId)?.name || 'N/A'}
               </div>
            </div>

            {isAdmin && worker.externalNotes && (
              <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded text-xs text-amber-900 dark:text-amber-400 italic">
                <span className="font-bold not-italic">Nota:</span> {worker.externalNotes}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const ProjectsView = ({ 
  isAdmin, projects, workers, editProject, addProject 
}: any) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempProjectColor, setTempProjectColor] = useState('#3b82f6');
  const [tempProjectDesc, setTempProjectDesc] = useState('');

  // Manage Members State
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);
  const [tempMembers, setTempMembers] = useState<string[]>([]);

  // Handlers
  const handleCreateProject = () => {
    if (!tempProjectName) return;
    addProject({
      id: `proj${Date.now()}`,
      name: tempProjectName,
      color: tempProjectColor,
      description: tempProjectDesc || 'Sin descripción',
      memberIds: []
    });
    setIsCreateProjectModalOpen(false);
    setTempProjectName('');
    setTempProjectDesc('');
  };

  const openProjectEdit = (project: Project) => {
    setEditingProject(project);
    setTempProjectName(project.name);
    setTempProjectColor(project.color);
    setTempProjectDesc(project.description || '');
  };

  const saveProjectEdit = () => {
    if (editingProject && tempProjectName) {
      editProject({ 
        ...editingProject, 
        name: tempProjectName, 
        color: tempProjectColor,
        description: tempProjectDesc
      });
      setEditingProject(null);
    }
  };

  const openManageMembers = (project: Project) => {
    setManagingMembersProject(project);
    setTempMembers(project.memberIds || []);
  };

  const toggleMember = (workerId: string) => {
    setTempMembers(prev => 
      prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]
    );
  };

  const saveMembers = () => {
    if (managingMembersProject) {
        editProject({ ...managingMembersProject, memberIds: tempMembers });
        setManagingMembersProject(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isAdmin && (
           <button 
             onClick={() => { setTempProjectName(''); setTempProjectColor('#3b82f6'); setIsCreateProjectModalOpen(true); }}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
           >
             <Plus size={18} /> Nuevo Proyecto
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project: Project) => (
          <Card key={project.id} className="p-0 overflow-hidden hover:shadow-md transition">
             <div className="h-2" style={{ backgroundColor: project.color }}></div>
             <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{project.name}</h3>
                  {isAdmin && (
                    <div className="flex gap-2">
                        <button onClick={() => openManageMembers(project)} className="text-slate-400 hover:text-green-500 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Gestionar Miembros">
                          <Users size={18} />
                        </button>
                        <button onClick={() => openProjectEdit(project)} className="text-slate-400 hover:text-blue-500 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Editar Proyecto">
                          <Pencil size={18} />
                        </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 min-h-[40px]">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                      <span>ID: {project.id}</span>
                   </div>
                   {project.memberIds && project.memberIds.length > 0 && (
                      <span className="font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1">
                          <UserIcon size={12} /> {project.memberIds.length} Miembros
                      </span>
                   )}
                </div>
             </div>
          </Card>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Nuevo Proyecto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value={tempProjectName} onChange={e => setTempProjectName(e.target.value)} placeholder="Ej: Lanzamiento V2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value={tempProjectDesc} onChange={e => setTempProjectDesc(e.target.value)} placeholder="Breve descripción..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-10 h-10 p-1 rounded cursor-pointer" value={tempProjectColor} onChange={e => setTempProjectColor(e.target.value)} />
                  <span className="text-sm text-slate-500">{tempProjectColor}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsCreateProjectModalOpen(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
                <button onClick={handleCreateProject} disabled={!tempProjectName} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Crear</button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FolderKanban size={20} /> Editar Proyecto
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
                <input 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea 
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                  value={tempProjectDesc}
                  onChange={(e) => setTempProjectDesc(e.target.value)}
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
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button 
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveProjectEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {managingMembersProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Asignar Miembros</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-4">{managingMembersProject.name}</p>
            <p className="text-xs text-slate-500 mb-4">Selecciona los miembros que pertenecen directamente a este proyecto.</p>
            
            <div className="flex-1 overflow-y-auto border dark:border-slate-700 rounded-lg p-2 space-y-1 mb-4">
              <div className="grid gap-1">
                 {workers.map(worker => (
                    <label key={worker.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer transition border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                      <input 
                        type="checkbox" 
                        checked={tempMembers.includes(worker.id)}
                        onChange={() => toggleMember(worker.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                           {worker.name.charAt(0)}
                        </div>
                        <div>
                           <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{worker.name}</div>
                           <div className="text-[10px] text-slate-400">{worker.functionalRoles.slice(0, 1).join(', ')}</div>
                        </div>
                      </div>
                    </label>
                 ))}
                 {workers.length === 0 && <p className="text-sm text-center p-4 text-slate-400">No hay miembros registrados.</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
              <button onClick={() => setManagingMembersProject(null)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
              <button onClick={saveMembers} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm">Guardar Asignación</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- TEAMS VIEW (NEW SEPARATED VIEW) ---
const TeamsView = ({ isAdmin, projects, teams, workers, addTeam, updateTeam }: any) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  // Forms
  const [tempTeamName, setTempTeamName] = useState('');
  const [tempTeamMembers, setTempTeamMembers] = useState<string[]>([]);

  // Effect to ensure valid selection if projects change
  useEffect(() => {
    if (projects.length > 0 && !projects.find((p: Project) => p.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const activeProject = projects.find((p: Project) => p.id === selectedProjectId);
  const projectTeams = teams.filter((t: Team) => t.projectId === selectedProjectId);

  const handleCreateTeam = () => {
    if(!tempTeamName || !activeProject) return;
    addTeam({
      id: `team${Date.now()}`,
      projectId: activeProject.id,
      name: tempTeamName,
      memberIds: []
    });
    setIsCreateTeamModalOpen(false);
    setTempTeamName('');
  };

  const openEditTeamMembers = (team: Team) => {
    setEditingTeam(team);
    setTempTeamMembers([...team.memberIds]);
  };

  const toggleTeamMember = (workerId: string) => {
    setTempTeamMembers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const saveTeamMembers = () => {
    if (editingTeam) {
      updateTeam({ ...editingTeam, memberIds: tempTeamMembers });
      setEditingTeam(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Contexto */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 uppercase">Proyecto Contexto:</span>
            <select 
              className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-medium"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p: Project) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
         </div>

         {isAdmin && (
           <button 
             onClick={() => setIsCreateTeamModalOpen(true)}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition"
           >
             <Plus size={18} /> Nueva Pareja/Equipo
           </button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectTeams.map((team: Team) => (
          <Card key={team.id} className="p-6 relative group">
             <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{team.name}</h3>
                {isAdmin && (
                  <button onClick={() => openEditTeamMembers(team)} className="text-slate-400 hover:text-blue-500 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition" title="Editar Miembros">
                     <Settings size={18} />
                  </button>
                )}
             </div>
             
             <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Miembros ({team.memberIds.length})</p>
                {team.memberIds.length > 0 ? (
                  <div className="space-y-2">
                    {team.memberIds.map(mid => {
                      const w = workers.find((wk: Worker) => wk.id === mid);
                      return w ? (
                        <div key={mid} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">
                              {w.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{w.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{w.functionalRoles.join(', ')}</p>
                           </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">Sin miembros asignados.</p>
                )}
             </div>
          </Card>
        ))}
        {projectTeams.length === 0 && (
          <div className="col-span-full p-10 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
             <Users size={48} className="mx-auto mb-4 opacity-50" />
             <p>No hay parejas o equipos configurados en este proyecto.</p>
          </div>
        )}
      </div>

       {/* Create Team Modal */}
       {isCreateTeamModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Nueva Pareja de Ministración</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de la Pareja/Equipo</label>
                <input className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" value={tempTeamName} onChange={e => setTempTeamName(e.target.value)} placeholder="Ej: Pareja Delta" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsCreateTeamModalOpen(false)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
                <button onClick={handleCreateTeam} disabled={!tempTeamName} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Crear</button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Members Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Armar Pareja: {editingTeam.name}</h3>
            <p className="text-sm text-slate-500 mb-4">Selecciona los miembros. Esto actualizará las conexiones en el grafo.</p>
            
            <div className="flex-1 overflow-y-auto border dark:border-slate-700 rounded-lg p-2 space-y-1 mb-4">
              {workers.map(worker => (
                <label key={worker.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={tempTeamMembers.includes(worker.id)}
                    onChange={() => toggleTeamMember(worker.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px]">{worker.name.charAt(0)}</div>
                     <div>
                       <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{worker.name}</div>
                       <div className="text-[10px] text-slate-400">{worker.functionalRoles.join(', ')}</div>
                     </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTeam(null)} className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
              <button onClick={saveTeamMembers} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Miembros</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// --- TASKS VIEW ---

interface TasksViewProps {
  isAdmin: boolean;
  tasks: Task[];
  projects: Project[];
  teams: Team[];
  workers: Worker[];
  addTask: (t: Task) => void;
  editTask: (t: Task) => void;
  deleteTask: (id: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ isAdmin, tasks, projects, teams, workers, addTask, editTask, deleteTask }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'BOARD'>('LIST');
  const [groupBy, setGroupBy] = useState<'NONE' | 'PROJECT' | 'STATUS' | 'WORKER'>('NONE');
  const [filterText, setFilterText] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [formProjectId, setFormProjectId] = useState('');
  const [formTeamId, setFormTeamId] = useState('');
  const [formWorkerId, setFormWorkerId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('GREEN');
  const [formStage, setFormStage] = useState<TaskStage>('TODO');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Handle Opening Modal (Create vs Edit)
  const openCreateModal = () => {
    setEditingTask(null);
    setFormProjectId(projects[0]?.id || '');
    setFormTeamId('');
    setFormWorkerId('');
    setFormTitle('');
    setFormStatus('GREEN');
    setFormStage('TODO');
    setFormDueDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormProjectId(task.projectId);
    setFormTeamId(task.teamId);
    setFormWorkerId(task.workerId);
    setFormTitle(task.title);
    setFormStatus(task.status);
    setFormStage(task.stage || 'TODO'); // Default for legacy data
    // Format date for input type="date"
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setFormNotes(task.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formTitle || !formWorkerId || !formTeamId || !formProjectId) return;

    const taskData: Task = {
      id: editingTask ? editingTask.id : `tsk${Date.now()}`,
      title: formTitle,
      workerId: formWorkerId,
      teamId: formTeamId,
      projectId: formProjectId,
      status: formStatus,
      stage: formStage,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : undefined,
      notes: formNotes
    };

    if (editingTask) {
      editTask(taskData);
    } else {
      addTask(taskData);
    }
    setIsModalOpen(false);
  };

  const handleQuickStatusChange = (task: Task, newStatus: TaskStatus) => {
    let updates: Partial<Task> = { status: newStatus };
    // Handle Block Reason automatically for quick switches
    if (newStatus !== 'RED') {
        updates.blockReason = undefined;
    } else if (!task.blockReason) {
         updates.blockReason = "Bloqueo registrado manualmente";
    }
    editTask({ ...task, ...updates });
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStage: TaskStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id === taskId);
    
    if (task && (task.stage || 'TODO') !== newStage && isAdmin) {
      editTask({ ...task, stage: newStage });
    }
  };

  // Derived options for select dropdowns (Cascading)
  const availableTeams = teams.filter(t => t.projectId === formProjectId);
  const availableWorkers = useMemo(() => {
     if(!formTeamId) return [];
     const team = teams.find(t => t.id === formTeamId);
     if(!team) return [];
     return workers.filter(w => team.memberIds.includes(w.id));
  }, [formTeamId, teams, workers]);


  // Grouping Logic for LIST VIEW
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(filterText.toLowerCase()));
  
  const groupedTasks: Record<string, Task[]> = useMemo(() => {
    if (groupBy === 'NONE') return { 'Todas las Tareas': filteredTasks };
    
    const groups: Record<string, Task[]> = {};
    
    filteredTasks.forEach(task => {
      let key = '';
      if (groupBy === 'PROJECT') {
        key = projects.find(p => p.id === task.projectId)?.name || 'Sin Proyecto';
      } else if (groupBy === 'STATUS') {
        key = task.status;
      } else if (groupBy === 'WORKER') {
        key = workers.find(w => w.id === task.workerId)?.name || 'Sin Asignar';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    
    return groups;
  }, [filteredTasks, groupBy, projects, workers]);

  return (
    <div className="space-y-6">
      
      {/* Toolbar */}
      <Card className="p-4 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64">
             <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               placeholder="Filtrar por nombre..." 
               className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600"
               value={filterText}
               onChange={e => setFilterText(e.target.value)}
             />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
             <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200 dark:border-slate-600">
                <button 
                  onClick={() => setViewMode('LIST')} 
                  className={`p-1.5 rounded-md transition ${viewMode === 'LIST' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                  title="Vista de Lista"
                >
                  <LayoutList size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('BOARD')} 
                  className={`p-1.5 rounded-md transition ${viewMode === 'BOARD' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                  title="Tablero Kanban"
                >
                  <LayoutGrid size={18} />
                </button>
             </div>
          </div>

          {viewMode === 'LIST' && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Layers size={18} />
              <span className="hidden md:inline">Agrupar por:</span>
              <select 
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none font-medium dark:bg-slate-700 dark:border-slate-600"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
              >
                <option value="NONE">Sin Agrupar</option>
                <option value="PROJECT">Proyecto</option>
                <option value="STATUS">Estado</option>
                <option value="WORKER">Miembro</option>
              </select>
            </div>
          )}
        </div>

        {isAdmin && (
          <button 
            onClick={openCreateModal}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus size={18} /> Nueva Tarea
          </button>
        )}
      </Card>

      {/* VIEW CONTENT */}
      {viewMode === 'LIST' ? (
        <div className="space-y-8">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className="space-y-3 animate-in fade-in duration-500">
              {groupBy !== 'NONE' && (
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
                  {groupName} <span className="text-slate-400 text-sm font-normal">({groupTasks.length})</span>
                </h3>
              )}
              
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Tarea</th>
                      <th className="px-6 py-3 hidden lg:table-cell">Etapa</th>
                      <th className="px-6 py-3 hidden lg:table-cell">Fechas</th>
                      <th className="px-6 py-3 hidden md:table-cell">Proyecto / Equipo</th>
                      <th className="px-6 py-3 hidden md:table-cell">Responsable</th>
                      {isAdmin && <th className="px-6 py-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {groupTasks.map(task => {
                      const project = projects.find(p => p.id === task.projectId);
                      const team = teams.find(t => t.id === task.teamId);
                      const worker = workers.find(w => w.id === task.workerId);

                      return (
                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                          <td className="px-6 py-4 w-32">
                            {isAdmin ? (
                               <div className="relative">
                                  <select 
                                    value={task.status}
                                    onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                                      task.status === 'GREEN' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 focus:ring-green-500' :
                                      task.status === 'YELLOW' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 focus:ring-yellow-500' :
                                      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 focus:ring-red-500'
                                    }`}
                                  >
                                    <option value="GREEN">GREEN</option>
                                    <option value="YELLOW">YELLOW</option>
                                    <option value="RED">RED</option>
                                  </select>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                     <ChevronDown size={12} className={
                                        task.status === 'GREEN' ? 'text-green-700 dark:text-green-400' :
                                        task.status === 'YELLOW' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                                     } />
                                  </div>
                               </div>
                            ) : (
                              <Badge status={task.status} />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{task.title}</div>
                            {task.status === 'RED' && (
                              <div className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                                <AlertTriangle size={12} /> {task.blockReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <span className="text-xs font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">
                              {task.stage === 'TODO' ? 'Por Hacer' : task.stage === 'IN_PROGRESS' ? 'En Progreso' : 'Hecho'}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-500 dark:text-slate-400">
                             <div title="Creada" className="flex items-center gap-1 mb-1">
                               <Calendar size={12} className="text-slate-400" /> 
                               {new Date(task.createdAt).toLocaleDateString()}
                             </div>
                             {task.dueDate && (
                               <div title="Vencimiento" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                 <Clock size={12} />
                                 {new Date(task.dueDate).toLocaleDateString()}
                               </div>
                             )}
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">{project?.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{team?.name}</div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                             <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-200">
                                 {worker?.name.charAt(0)}
                               </div>
                               <div className="text-sm text-slate-600 dark:text-slate-300">{worker?.name}</div>
                             </div>
                          </td>
                          {isAdmin && (
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => openEditModal(task)}
                                   className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded transition"
                                 >
                                   <Pencil size={16} />
                                 </button>
                                 <button 
                                   onClick={() => deleteTask(task.id)}
                                   className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {groupTasks.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">No hay tareas en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
           {/* TODO COLUMN */}
           <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'TODO')}
              className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 flex flex-col gap-4 border border-slate-200 dark:border-slate-800"
           >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                 <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Circle size={18} /> POR HACER
                 </h3>
                 <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold">
                    {filteredTasks.filter(t => (t.stage || 'TODO') === 'TODO').length}
                 </span>
              </div>
              <div className="flex-1 space-y-3">
                 {filteredTasks.filter(t => (t.stage || 'TODO') === 'TODO').map(task => (
                    <KanbanCard key={task.id} task={task} projects={projects} workers={workers} isAdmin={isAdmin} onEdit={() => openEditModal(task)} onDragStart={handleDragStart} />
                 ))}
              </div>
           </div>

           {/* IN PROGRESS COLUMN */}
           <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col gap-4 border border-blue-100 dark:border-blue-900/30"
           >
              <div className="flex justify-between items-center border-b border-blue-200 dark:border-blue-800 pb-3">
                 <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <ArrowRightCircle size={18} /> EN PROGRESO
                 </h3>
                 <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-bold">
                    {filteredTasks.filter(t => t.stage === 'IN_PROGRESS').length}
                 </span>
              </div>
              <div className="flex-1 space-y-3">
                 {filteredTasks.filter(t => t.stage === 'IN_PROGRESS').map(task => (
                    <KanbanCard key={task.id} task={task} projects={projects} workers={workers} isAdmin={isAdmin} onEdit={() => openEditModal(task)} onDragStart={handleDragStart} />
                 ))}
              </div>
           </div>

           {/* DONE COLUMN */}
           <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'DONE')}
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex flex-col gap-4 border border-green-100 dark:border-green-900/30"
           >
              <div className="flex justify-between items-center border-b border-green-200 dark:border-green-800 pb-3">
                 <h3 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckSquare size={18} /> HECHO
                 </h3>
                 <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold">
                    {filteredTasks.filter(t => t.stage === 'DONE').length}
                 </span>
              </div>
              <div className="flex-1 space-y-3">
                 {filteredTasks.filter(t => t.stage === 'DONE').map(task => (
                    <KanbanCard key={task.id} task={task} projects={projects} workers={workers} isAdmin={isAdmin} onEdit={() => openEditModal(task)} onDragStart={handleDragStart} />
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                 {editingTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={24} />
               </button>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium mb-1">Título de la Tarea</label>
                   <input 
                     className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600"
                     placeholder="Ej: Implementar Login"
                     value={formTitle}
                     onChange={e => setFormTitle(e.target.value)}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Proyecto</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                      value={formProjectId}
                      onChange={e => {
                        setFormProjectId(e.target.value);
                        setFormTeamId(''); // Reset dependency
                        setFormWorkerId(''); // Reset dependency
                      }}
                      disabled={!!editingTask} 
                    >
                      <option value="">-- Seleccionar --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Equipo (Pareja)</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                      value={formTeamId}
                      onChange={e => {
                        setFormTeamId(e.target.value);
                        setFormWorkerId(''); // Reset dependency
                      }}
                      disabled={!formProjectId}
                    >
                      <option value="">-- Seleccionar --</option>
                      {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium mb-1">Responsable</label>
                     <select 
                        className="w-full p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                        value={formWorkerId}
                        onChange={e => setFormWorkerId(e.target.value)}
                        disabled={!formTeamId}
                      >
                        <option value="">-- Seleccionar Responsable --</option>
                        {availableWorkers.length > 0 ? (
                           availableWorkers.map(w => (
                             <option key={w.id} value={w.id}>
                               {w.name} {w.functionalRoles?.length ? `(${w.functionalRoles.join(', ')})` : ''}
                             </option>
                           ))
                        ) : (
                           formTeamId && <option value="" disabled>No hay miembros en este equipo</option>
                        )}
                      </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1">Fecha de Finalización</label>
                     <input 
                        type="date"
                        className="w-full p-2 border border-slate-300 rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                        value={formDueDate}
                        onChange={e => setFormDueDate(e.target.value)}
                      />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium mb-1">Notas Adicionales (Opcional)</label>
                   <textarea 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 h-20 resize-none"
                      placeholder="Detalles extra sobre la tarea..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium mb-2">Estado de Salud</label>
                   <div className="flex gap-4">
                      {(['GREEN', 'YELLOW', 'RED'] as TaskStatus[]).map(s => (
                         <label key={s} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              name="status" 
                              value={s}
                              checked={formStatus === s}
                              onChange={() => setFormStatus(s)}
                            />
                            <Badge status={s} />
                         </label>
                      ))}
                   </div>
                </div>

                {editingTask && (
                   <div className="mt-4">
                      <label className="block text-sm font-medium mb-2">Etapa (Kanban)</label>
                      <div className="flex gap-2 text-sm">
                         {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStage[]).map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setFormStage(s)}
                              className={`px-3 py-1 rounded border ${formStage === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}
                            >
                               {s === 'TODO' ? 'Por Hacer' : s === 'IN_PROGRESS' ? 'En Progreso' : 'Hecho'}
                            </button>
                         ))}
                      </div>
                   </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
                   <button 
                     onClick={handleSubmit} 
                     disabled={!formTitle || !formWorkerId}
                     className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow disabled:opacity-50"
                   >
                     {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                   </button>
                </div>
             </div>
          </Card>
        </div>
      )}

    </div>
  );
};

const KanbanCard = ({ task, projects, workers, isAdmin, onEdit, onDragStart }: { task: Task, projects: Project[], workers: Worker[], isAdmin: boolean, onEdit: () => void, onDragStart: (e: React.DragEvent, id: string) => void }) => {
   const project = projects.find(p => p.id === task.projectId);
   const worker = workers.find(w => w.id === task.workerId);
   
   const getStatusStyles = (s: TaskStatus) => {
      switch(s) {
         case 'RED': return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500 border-y border-r border-red-200 dark:border-red-800';
         case 'YELLOW': return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500 border-y border-r border-yellow-200 dark:border-yellow-800';
         case 'GREEN': return 'bg-white dark:bg-slate-800 border-l-4 border-l-green-500 border-y border-r border-slate-200 dark:border-slate-700';
         default: return 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
      }
   }

   return (
      <div 
        draggable={isAdmin}
        onDragStart={(e) => onDragStart(e, task.id)}
        className={`
           p-3 rounded-lg shadow-sm 
           hover:shadow-md transition cursor-grab active:cursor-grabbing group relative
           ${getStatusStyles(task.status)}
        `}
      >
         <div className="flex justify-between items-start mb-2">
            <span 
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide truncate max-w-[120px]"
              style={{ backgroundColor: `${project?.color}20`, color: project?.color }}
            >
               {project?.name}
            </span>
            <div className="flex items-center gap-2">
               {/* Always show health badge in Kanban Card */}
               <Badge status={task.status} />
               {isAdmin && (
                  <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition">
                     <Pencil size={14} />
                  </button>
               )}
            </div>
         </div>
         
         <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-3 line-clamp-2">{task.title}</p>
         
         {task.status === 'RED' && (
            <div className="text-xs text-red-500 mb-3 bg-red-100 dark:bg-red-900/30 p-1.5 rounded border border-red-200 dark:border-red-800 flex items-start gap-1">
               <AlertTriangle size={12} className="shrink-0 mt-0.5" />
               <span className="leading-tight font-semibold">{task.blockReason || 'Bloqueado'}</span>
            </div>
         )}
         
         <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">
            <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-200">
                  {worker?.name.charAt(0)}
               </div>
               <span className="truncate max-w-[100px]">{worker?.name}</span>
            </div>
            {task.dueDate && (
               <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500 font-bold' : ''}`}>
                  <Clock size={12} />
                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
               </div>
            )}
         </div>
      </div>
   );
};
