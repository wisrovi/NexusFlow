import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Project, Team, Worker, Task, GraphNode } from '../types';

interface OrgChartProps {
  projects: Project[];
  teams: Team[];
  workers: Worker[];
  tasks: Task[];
}

export const OrgChart: React.FC<OrgChartProps> = ({ projects, teams, workers, tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  useEffect(() => {
    if (!projects.length || !svgRef.current) return;

    // 1. Data Transformation (Strict Hierarchy for Tree View)
    const buildHierarchy = (): GraphNode => {
      const root: GraphNode = { name: "Nexus", type: "ROOT", children: [] };
      
      projects.forEach(proj => {
        const projNode: GraphNode = { name: proj.name, type: "PROJECT", data: proj, children: [] };
        const projTeams = teams.filter(t => t.projectId === proj.id);
        
        projTeams.forEach(team => {
          const teamNode: GraphNode = { name: team.name, type: "TEAM", data: team, children: [] };
          
          team.memberIds.forEach(memberId => {
            const worker = workers.find(w => w.id === memberId);
            if (worker) {
              const workerTasks = tasks.filter(t => t.workerId === worker.id && t.projectId === proj.id && t.teamId === team.id);
              
              const taskNodes: GraphNode[] = workerTasks.map(task => ({
                name: task.title,
                type: "TASK",
                data: task,
                children: []
              }));
              
              // We create a new node object for the worker in this specific team context
              teamNode.children?.push({
                name: worker.name,
                type: "WORKER",
                data: worker,
                children: taskNodes
              });
            }
          });
          
          projNode.children?.push(teamNode);
        });
        root.children?.push(projNode);
      });
      return root;
    };

    const data = buildHierarchy();
    const root = d3.hierarchy(data);

    // 2. Layout Configuration
    const nodeWidth = 260;  // Horizontal space for card
    const nodeHeight = 120; // Vertical spacing between siblings
    const levelGap = 280;   // Horizontal spacing between levels

    // Tree Layout: y = x (horizontal), x = y (vertical) for d3.tree
    const treeLayout = d3.tree<GraphNode>()
      .nodeSize([nodeHeight, levelGap]) 
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.3));

    treeLayout(root);

    // 3. SVG & Zoom Setup
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Calculate bounding box to center the tree
    let x0 = Infinity, x1 = -Infinity;
    let y0 = Infinity, y1 = -Infinity;
    root.each((d: any) => {
      if (d.x < x0) x0 = d.x;
      if (d.x > x1) x1 = d.x;
      if (d.y < y0) y0 = d.y;
      if (d.y > y1) y1 = d.y;
    });

    // Initial Center Transform
    const initialScale = 0.75;
    // Center vertically in viewport
    const initialY = (dimensions.height / 2) - ((x0 + x1) / 2) * initialScale;
    const initialX = 80; // Padding from left

    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialScale));

    // 4. Draw Links (Bezier Curves)
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1") // Slate-300
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any
      );

    // 5. Draw Nodes (ForeignObject for HTML/Tailwind)
    const nodes = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    nodes.append("foreignObject")
      .attr("width", 240)
      .attr("height", 100)
      .attr("y", -50) // Center vertically relative to node point
      .attr("x", -10)
      .style("overflow", "visible")
      .html((d: any) => {
        const { type, name } = d.data;
        const data = d.data.data;

        // --- RENDER TEMPLATES ---
        
        if (type === 'ROOT') {
           return `
             <div class="flex items-center justify-center h-24 w-24 bg-slate-900 text-white rounded-full border-4 border-slate-200 shadow-2xl ml-4 z-10 relative">
                <div class="text-center">
                   <div class="font-bold text-xs tracking-widest">NEXUS</div>
                   <div class="text-[10px] text-slate-400">CORE</div>
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
             <div class="w-[200px] bg-slate-50 border border-slate-200 rounded-full px-4 py-2 flex items-center shadow-sm h-12 mt-4">
                <div class="w-2 h-2 rounded-full bg-slate-400 mr-3 shrink-0"></div>
                <div class="font-semibold text-slate-700 text-sm truncate">${name}</div>
             </div>
           `;
        }

        if (type === 'WORKER') {
           const isHigh = data.intensity > 7;
           const isLow = data.intensity < 4;
           const intensityColor = isHigh ? 'text-red-500' : isLow ? 'text-green-500' : 'text-blue-500';
           
           return `
             <div class="w-[240px] bg-white rounded-xl shadow-md border border-slate-200 p-3 flex items-center gap-3 relative overflow-hidden h-full group hover:shadow-xl transition-all">
                <div class="absolute top-2 right-2 flex flex-col items-end">
                   <div class="text-[10px] font-bold ${intensityColor} bg-slate-50 px-1 rounded">Int: ${data.intensity}</div>
                </div>
                
                <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shrink-0 shadow-inner">
                  ${name.charAt(0)}
                </div>
                
                <div class="min-w-0 flex-1">
                   <div class="font-bold text-sm text-slate-900 truncate pr-4" title="${name}">${name}</div>
                   <div class="text-[10px] text-slate-500 uppercase tracking-wide font-bold truncate">${data.functionalRole}</div>
                   ${data.managerId ? `<div class="text-[9px] text-slate-400 mt-1 truncate">Reporta a: ...${data.managerId.slice(-4)}</div>` : ''}
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

  }, [projects, teams, workers, tasks, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-full bg-slate-50 rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing group">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-slate-200 z-10 flex flex-col items-end gap-1 pointer-events-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Controles</span>
        <span className="text-xs text-slate-600 font-medium">Scroll para Zoom</span>
        <span className="text-xs text-slate-600 font-medium">Arrastrar para Mover</span>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>
      
      <svg ref={svgRef} className="w-full h-full block touch-none"></svg>
    </div>
  );
};