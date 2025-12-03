import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Project, Team, Worker, Task, GraphNode } from '../types';
import { Filter, RefreshCw, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface OrgChartProps {
  projects: Project[];
  teams: Team[];
  workers: Worker[];
  tasks: Task[];
  onNodeClick: (node: GraphNode) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({ projects, teams, workers, tasks, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Filter States
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterMember, setFilterMember] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Computed lists for dropdowns
  const availableProjects = useMemo(() => projects, [projects]);
  const availableMembers = useMemo(() => workers.sort((a, b) => a.name.localeCompare(b.name)), [workers]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetFilters = () => {
    setFilterProject('ALL');
    setFilterMember('ALL');
    setFilterStatus('ALL');
  };

  const hasActiveFilters = filterProject !== 'ALL' || filterMember !== 'ALL' || filterStatus !== 'ALL';

  useEffect(() => {
    if (!projects.length || !svgRef.current) return;

    // 1. Data Transformation with Filtering
    const buildHierarchy = (): GraphNode => {
      const root: GraphNode = { name: "Nexus", type: "ROOT", children: [] };
      
      // Filter Projects first
      const filteredProjects = projects.filter(p => 
        filterProject === 'ALL' || p.id === filterProject
      );

      filteredProjects.forEach(proj => {
        const projNode: GraphNode = { name: proj.name, type: "PROJECT", data: proj, children: [] };
        
        // Find teams for this project
        const projTeams = teams.filter(t => t.projectId === proj.id);
        
        // Track if project has relevant children to decide whether to show it (in strict filter mode)
        let hasRelevantChildren = false;

        projTeams.forEach(team => {
          const teamNode: GraphNode = { name: team.name, type: "TEAM", data: team, children: [] };
          let teamHasRelevantChildren = false;

          team.memberIds.forEach(memberId => {
            // Filter Member
            if (filterMember !== 'ALL' && memberId !== filterMember) return;

            const worker = workers.find(w => w.id === memberId);
            if (worker) {
              // Filter Tasks
              let workerTasks = tasks.filter(t => t.workerId === worker.id && t.projectId === proj.id && t.teamId === team.id);
              
              if (filterStatus !== 'ALL') {
                workerTasks = workerTasks.filter(t => t.status === filterStatus);
              }

              // If filtering by status, only show worker if they have matching tasks
              // If filtering by member, we want to show the member even if they have no tasks (unless status filter is also on)
              if (filterStatus !== 'ALL' && workerTasks.length === 0) {
                 return; 
              }

              const taskNodes: GraphNode[] = workerTasks.map(task => ({
                name: task.title,
                type: "TASK",
                data: task,
                children: []
              }));
              
              teamNode.children?.push({
                name: worker.name,
                type: "WORKER",
                data: worker,
                children: taskNodes
              });
              
              teamHasRelevantChildren = true;
            }
          });
          
          if (teamHasRelevantChildren) {
             projNode.children?.push(teamNode);
             hasRelevantChildren = true;
          }
        });

        // DIRECT MEMBERS (Not in a Team)
        if (proj.memberIds && proj.memberIds.length > 0) {
          proj.memberIds.forEach(memberId => {
             // Filter Member
             if (filterMember !== 'ALL' && memberId !== filterMember) return;
             
             // Avoid duplicates if already in a team (visual choice)
             const inTeam = projTeams.some(t => t.memberIds.includes(memberId));
             
             if (!inTeam) {
                const worker = workers.find(w => w.id === memberId);
                if (worker) {
                    let workerTasks = tasks.filter(t => t.workerId === worker.id && t.projectId === proj.id && !t.teamId);
                    
                    if (filterStatus !== 'ALL') {
                       workerTasks = workerTasks.filter(t => t.status === filterStatus);
                    }
                    
                    if (filterStatus !== 'ALL' && workerTasks.length === 0) return;

                    const taskNodes: GraphNode[] = workerTasks.map(task => ({
                      name: task.title,
                      type: "TASK",
                      data: task,
                      children: []
                    }));

                    projNode.children?.push({
                      name: worker.name,
                      type: "WORKER",
                      data: worker,
                      children: taskNodes
                    });
                    hasRelevantChildren = true;
                }
             }
          });
        }
        
        // Decision to add Project Node
        // If NO filters are applied, show everything (even empty projects)
        // If filters ARE applied, only show projects with relevant content
        if (!hasActiveFilters) {
           root.children?.push(projNode);
        } else if (hasRelevantChildren) {
           root.children?.push(projNode);
        } else if (filterProject !== 'ALL' && filterMember === 'ALL' && filterStatus === 'ALL') {
           // Special case: If I explicitly selected a project, show it even if empty
           root.children?.push(projNode);
        }
      });
      return root;
    };

    const data = buildHierarchy();
    const root = d3.hierarchy(data);

    // 2. Layout Configuration
    const nodeWidth = 260;  
    const nodeHeight = 120; 
    const levelGap = 280;   

    // Tree Layout
    const treeLayout = d3.tree<GraphNode>()
      .nodeSize([nodeHeight, levelGap]) 
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3));

    treeLayout(root);

    // 3. SVG & Zoom Setup
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial Center Calculation
    let x0 = Infinity, x1 = -Infinity;
    root.each((d: any) => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
    });

    const initialScale = 0.75;
    const initialY = (dimensions.height / 2) - ((x0 + x1) / 2) * initialScale;
    const initialX = 80;

    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    // 4. Draw Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any
      );

    // 5. Draw Nodes
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
         event.stopPropagation();
         if (d.data.type !== 'ROOT') {
            onNodeClick(d.data);
         }
      });

    nodes.append("foreignObject")
      .attr("width", 240)
      .attr("height", 100)
      .attr("y", -50)
      .attr("x", -10)
      .style("overflow", "visible")
      .style("pointer-events", "none")
      .html((d: any) => {
        const { type, name } = d.data;
        const data = d.data.data;

        if (type === 'ROOT') {
           return `
             <div class="flex items-center justify-center h-24 w-24 bg-slate-900 text-white rounded-full border-4 border-slate-200 shadow-2xl ml-4 z-10 relative">
                <div class="text-center">
                   <div class="font-bold text-xs tracking-widest">NEXUS</div>
                </div>
             </div>
           `;
        }
        
        if (type === 'PROJECT') {
           return `
             <div class="w-[220px] bg-white rounded-lg shadow-lg border-l-[6px] p-3 flex flex-col justify-center h-full hover:scale-105 transition-transform duration-200" style="border-left-color: ${data.color}">
                <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Proyecto</div>
                <div class="font-bold text-slate-800 text-sm leading-snug">${name}</div>
             </div>
           `;
        }
        
        if (type === 'TEAM') {
           return `
             <div class="w-[200px] bg-slate-50 border border-slate-200 rounded-full px-4 py-2 flex items-center shadow-sm h-12 mt-4 hover:bg-slate-100 transition-colors">
                <div class="w-2 h-2 rounded-full bg-slate-400 mr-3 shrink-0"></div>
                <div class="font-semibold text-slate-700 text-sm truncate">${name}</div>
             </div>
           `;
        }

        if (type === 'WORKER') {
           const isHigh = data.intensity > 7;
           const isLow = data.intensity < 4;
           const intensityColor = isHigh ? 'text-red-500' : isLow ? 'text-green-500' : 'text-blue-500';
           
           const rolesHtml = data.functionalRoles && data.functionalRoles.length > 0 
             ? data.functionalRoles.map((r: string) => 
                 `<span class="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200 mr-1 mb-1 leading-none whitespace-nowrap">${r}</span>`
               ).join('') 
             : '<span class="text-[9px] text-slate-400 italic">Sin roles</span>';

           return `
             <div class="w-[240px] bg-white rounded-xl shadow-md border border-slate-200 p-2.5 flex items-start gap-2 relative overflow-hidden h-full group hover:shadow-xl transition-all">
                <div class="absolute top-2 right-2">
                   <div class="text-[9px] font-bold ${intensityColor} bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">Int: ${data.intensity}</div>
                </div>
                
                <div class="mt-1 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shrink-0 shadow-inner text-sm">
                  ${name.charAt(0)}
                </div>
                
                <div class="min-w-0 flex-1 pt-0.5">
                   <div class="font-bold text-sm text-slate-900 truncate pr-12 mb-1.5" title="${name}">${name}</div>
                   <div class="flex flex-wrap content-start max-h-[42px] overflow-hidden">
                      ${rolesHtml}
                   </div>
                </div>
             </div>
           `;
        }

        if (type === 'TASK') {
           const status = data.status;
           let styles = "border-slate-200 bg-white";
           let icon = `<span class="text-green-600 font-bold">✓</span>`;
           let label = "text-slate-600";
           
           if(status === 'YELLOW') { 
             styles = "border-yellow-200 bg-yellow-50"; 
             icon = `<span class="text-yellow-600 text-lg">●</span>`;
           }
           if(status === 'RED') { 
             styles = "border-red-300 bg-red-50 shadow-red-100"; 
             icon = `<span class="text-red-600 font-bold text-lg">!</span>`;
             label = "text-red-800 font-medium";
           }

           return `
             <div class="w-[220px] rounded-md shadow-sm border p-2 flex items-center gap-3 h-16 ${styles} hover:scale-105 transition-transform">
                <div class="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                   ${icon}
                </div>
                <div class="min-w-0 flex-1">
                   <div class="text-xs ${label} leading-tight line-clamp-2" title="${name}">${name}</div>
                   ${status === 'RED' ? `<div class="text-[9px] text-red-600 font-bold mt-1 uppercase tracking-wider">BLOQUEO</div>` : ''}
                </div>
             </div>
           `;
        }

        return `<div class="p-2 border">${name}</div>`;
      });

  }, [projects, teams, workers, tasks, dimensions, onNodeClick, filterProject, filterMember, filterStatus, hasActiveFilters]);

  // --- FILTERS UI ---
  const FiltersOverlay = () => (
    <div className="absolute top-4 left-4 right-4 md:right-auto z-20 flex flex-col gap-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-xl border border-slate-200 dark:border-slate-700 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 max-w-full md:max-w-4xl">
      <div className="flex items-center justify-between gap-4">
         <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
            <Filter size={18} className="text-blue-500" />
            <span className="text-sm">Filtros de Visualización</span>
         </div>
         
         {hasActiveFilters && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 transition text-xs font-bold"
              title="Limpiar todos los filtros"
            >
              <X size={14} />
              Limpiar filtros
            </button>
         )}
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
           <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Proyecto</label>
           <select 
             className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
             value={filterProject}
             onChange={(e) => setFilterProject(e.target.value)}
           >
             <option value="ALL">Todos los Proyectos</option>
             {availableProjects.map(p => (
               <option key={p.id} value={p.id}>{p.name}</option>
             ))}
           </select>
        </div>

        <div className="flex-1 min-w-[200px]">
           <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Miembro</label>
           <select 
             className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
             value={filterMember}
             onChange={(e) => setFilterMember(e.target.value)}
           >
             <option value="ALL">Todos los Miembros</option>
             {availableMembers.map(w => (
               <option key={w.id} value={w.id}>{w.name}</option>
             ))}
           </select>
        </div>

        <div className="flex-1 min-w-[200px]">
           <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Estado Tareas</label>
           <select 
             className="w-full text-xs p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="ALL">Todos los Estados</option>
             <option value="RED">⚠️ Bloqueos (RED)</option>
             <option value="YELLOW">⚠️ En Riesgo (YELLOW)</option>
             <option value="GREEN">✅ Al día (GREEN)</option>
           </select>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing group">
      
      <FiltersOverlay />

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 z-10 flex flex-col items-end gap-1 pointer-events-none hidden md:flex">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controles</span>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Click en Nodos para Detalles</span>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Scroll para Zoom</span>
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Arrastrar para Mover</span>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>
      
      <svg ref={svgRef} className="w-full h-full block touch-none"></svg>
    </div>
  );
};