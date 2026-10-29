import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  Building2,
  FileText,
  Layers,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  X,
  Maximize2,
  RefreshCw,
  Info,
  Scale,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

// Custom Node: Institution Node
const InstitutionNodeComponent = ({ data }: NodeProps) => {
  return (
    <div className={`p-4 rounded-2xl border shadow-2xl min-w-56 text-left transition ${
      data.hasActiveConflict
        ? 'bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-900 border-red-500 shadow-red-950/80'
        : 'bg-slate-900 border-blue-500/80 shadow-blue-950/50'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="font-mono text-[9px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.2 rounded border border-blue-800">
          {data.permanentId as string}
        </span>
        {data.hasActiveConflict ? (
          <span className="text-[9px] font-bold text-red-300 bg-red-950 px-1 rounded animate-pulse">
            COLLISION
          </span>
        ) : (
          <span className="text-[9px] font-bold text-emerald-400">
            ACTIVE
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center space-x-1.5">
          <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-xs font-bold text-white leading-tight line-clamp-2">
            {data.label as string}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          {data.city as string}, {data.state as string}
        </p>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="text-slate-400">Risk Score:</span>
        <span className="font-mono font-bold text-white">{data.riskScore as number}/100</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
};

// Custom Node: Case Node
const CaseNodeComponent = ({ data }: NodeProps) => {
  const isCritical = data.severityLevel === 'CRITICAL';
  const officerName = (data.assignedOfficer as string) || '';
  const bureauName = (data.bureauName as string) || '';
  const isAnanyaSen = officerName.includes('Ananya Sen') || bureauName.includes('Public Grievance');

  return (
    <div className={`p-3 rounded-xl border shadow-lg max-w-56 text-left transition ${
      isCritical
        ? 'bg-slate-900 border-red-500/80 shadow-red-950/40 ring-1 ring-red-500/30'
        : isAnanyaSen
        ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-900 border-emerald-500/80 shadow-emerald-950/40 ring-1 ring-emerald-500/30'
        : 'bg-slate-900 border-slate-700 shadow-slate-950/60'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[10px] font-bold truncate ${isAnanyaSen ? 'text-emerald-400' : 'text-blue-400'}`}>
          {data.caseNumber as string}
        </span>
        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
          isCritical
            ? 'bg-red-950 text-red-300'
            : isAnanyaSen
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
            : 'bg-slate-800 text-slate-300'
        }`}>
          {data.severityLevel as string}
        </span>
      </div>

      <p className="text-[11px] font-semibold text-white mt-1.5 leading-tight line-clamp-2">
        {data.title as string}
      </p>

      {isAnanyaSen && (
        <div className="mt-1.5 px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[9px] text-emerald-300 font-bold truncate flex items-center space-x-1">
          <Scale className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span>Officer: Smt. Ananya Sen</span>
        </div>
      )}

      <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
        <span className="truncate">{bureauName}</span>
        <span className="text-blue-400 font-mono">Dossier</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
};

// Custom Node: Bureau Node
const BureauNodeComponent = ({ data }: NodeProps) => {
  const isPgc = data.code === 'PGC' || (data.name as string)?.includes('Public Grievance');
  return (
    <div className={`p-3 rounded-xl border shadow-xl min-w-44 text-center ${
      isPgc
        ? 'bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 border-emerald-500 shadow-emerald-950/50'
        : 'bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 border-blue-500/60 shadow-xl'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <div className={`flex items-center justify-center space-x-1.5 mb-1 ${isPgc ? 'text-emerald-300' : 'text-blue-300'}`}>
        {isPgc ? <Scale className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        <span className="font-mono font-bold text-xs">{data.code as string}</span>
      </div>
      <p className="text-xs font-bold text-white leading-tight">
        {data.name as string}
      </p>
      <p className="text-[10px] text-slate-300 mt-1 font-semibold truncate">
        Head: {data.headOfficer as string}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
};

export const RelationshipGraphPage: React.FC = () => {
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [allEdges, setAllEdges] = useState<any[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [bureauFilter, setBureauFilter] = useState<'ALL' | 'PGC' | 'AB' | 'ARMC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const nodeTypes = useMemo(
    () => ({
      institutionNode: InstitutionNodeComponent,
      caseNode: CaseNodeComponent,
      bureauNode: BureauNodeComponent,
    }),
    []
  );

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await api.getGraphData();
      setAllNodes(res.nodes);
      setAllEdges(res.edges);
      applyFilter(res.nodes, res.edges, bureauFilter, searchQuery);
    } catch (e) {
      console.error('Failed to load relationship graph', e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (rawNodes: any[], rawEdges: any[], filter: 'ALL' | 'PGC' | 'AB' | 'ARMC', search: string) => {
    let filteredNodes = [...rawNodes];
    let filteredEdges = [...rawEdges];

    if (filter === 'PGC') {
      // Smt. Ananya Sen - Public Grievance Desk
      const pgcCaseNodeIds = new Set(
        rawNodes
          .filter(n => n.type === 'caseNode' && (
            n.data.bureauName?.includes('Public Grievance') ||
            n.data.bureauId === 'bur-pgc' ||
            n.data.assignedOfficer?.includes('Ananya Sen')
          ))
          .map(n => n.id)
      );

      // Also include conflict target cases (like case-05 court stay connected to case-04)
      rawEdges.forEach(e => {
        if (pgcCaseNodeIds.has(e.source)) pgcCaseNodeIds.add(e.target);
        if (pgcCaseNodeIds.has(e.target)) pgcCaseNodeIds.add(e.source);
      });

      filteredNodes = rawNodes.filter(n => {
        if (n.id === 'bureau-node-bur-pgc') return true;
        if (pgcCaseNodeIds.has(n.id)) return true;
        // Keep connected institutions
        if (n.type === 'institutionNode') {
          return rawEdges.some(e => e.source === n.id && pgcCaseNodeIds.has(e.target));
        }
        return false;
      });

      const visibleIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = rawEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    } else if (filter === 'AB') {
      // Approval Bureau
      filteredNodes = rawNodes.filter(n => 
        n.id === 'bureau-node-bur-ab' || 
        n.data.bureauId === 'bur-ab' || 
        (n.type === 'institutionNode' && rawEdges.some(e => e.source === n.id && e.target.includes('case-02') || e.target.includes('case-11')))
      );
      const visibleIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = rawEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    } else if (filter === 'ARMC') {
      // Anti-Ragging Bureau
      filteredNodes = rawNodes.filter(n => 
        n.id === 'bureau-node-bur-armc' || 
        n.data.bureauId === 'bur-armc' || 
        (n.type === 'institutionNode' && rawEdges.some(e => e.source === n.id && e.target.includes('case-01') || e.target.includes('case-13')))
      );
      const visibleIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = rawEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filteredNodes = filteredNodes.filter(n => {
        const text = `${n.data.label || ''} ${n.data.title || ''} ${n.data.caseNumber || ''} ${n.data.name || ''} ${n.data.assignedOfficer || ''}`.toLowerCase();
        return text.includes(q);
      });
      const visibleIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
    }

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  };

  const handleFilterChange = (filter: 'ALL' | 'PGC' | 'AB' | 'ARMC') => {
    setBureauFilter(filter);
    applyFilter(allNodes, allEdges, filter, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilter(allNodes, allEdges, bureauFilter, query);
  };

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeData(node);
  }, []);

  return (
    <div className="space-y-4 h-[calc(100vh-6.5rem)] flex flex-col">
      {/* Top bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            Interactive Institutional Case Relationship Graph
          </h1>
          <p className="text-xs text-slate-400">
            Live topological map linking Technical Institutions, Complaint Dossiers, Statutory Bureaus, Confirmed AI Links, and Conflict Collisions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center space-x-3 text-[11px] bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Institutions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Smt. Ananya Sen Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Other Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-red-500 inline-block" />
              Collision Alert
            </span>
          </div>

          <button
            onClick={loadGraph}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reload Graph"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Bureau Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-xs flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider pr-1">Filter Docket:</span>
          
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              bureauFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🌐 Full Council Network</span>
          </button>

          <button
            onClick={() => handleFilterChange('PGC')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              bureauFilter === 'PGC'
                ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                : 'bg-emerald-950/80 text-emerald-200 border border-emerald-600/40 hover:bg-emerald-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-300" />
            <span>⚖️ Smt. Ananya Sen (Public Grievance Cases)</span>
          </button>

          <button
            onClick={() => handleFilterChange('AB')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              bureauFilter === 'AB'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🏛️ Approval Bureau (EoA Scrutiny)</span>
          </button>

          <button
            onClick={() => handleFilterChange('ARMC')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              bureauFilter === 'ARMC'
                ? 'bg-red-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🛡️ Anti-Ragging & Vigilance</span>
          </button>
        </div>

        {/* Live Search inside graph */}
        <div className="relative min-w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search case, institution, or officer..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Graph Viewport */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2 z-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-xs">Generating topological graph nodes & edges...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-3 z-20">
            <Info className="w-8 h-8 text-slate-500" />
            <p className="text-xs">No graph nodes match the active filter.</p>
            <button
              onClick={() => handleFilterChange('ALL')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
            >
              Reset to Full Council Network
            </button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.2}
            maxZoom={1.8}
            className="bg-[#080d1a]"
          >
            <Background color="#1e293b" gap={24} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-white !rounded-lg" />
            <MiniMap
              nodeColor={n => (n.type === 'institutionNode' ? '#3b82f6' : n.type === 'bureauNode' ? '#10b981' : '#64748b')}
              maskColor="rgba(15, 23, 42, 0.7)"
              className="!bg-slate-900 !border-slate-800 !rounded-xl !overflow-hidden"
            />
          </ReactFlow>
        )}

        {/* Selected Node Details Sidebar Overlay */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 z-30 w-80 bg-slate-900/95 backdrop-blur border border-blue-500/40 rounded-xl shadow-2xl p-4 text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                {selectedNodeData.type === 'institutionNode'
                  ? 'Institution Hub'
                  : selectedNodeData.type === 'caseNode'
                  ? 'Case Dossier'
                  : 'Statutory Bureau'}
              </span>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white leading-tight">
                {selectedNodeData.data.label || selectedNodeData.data.title || selectedNodeData.data.name}
              </h4>
              {selectedNodeData.data.permanentId && (
                <p className="font-mono text-blue-400 text-[11px]">{selectedNodeData.data.permanentId}</p>
              )}
              {selectedNodeData.data.caseNumber && (
                <p className="font-mono text-blue-400 text-[11px] font-bold">{selectedNodeData.data.caseNumber}</p>
              )}
            </div>

            {selectedNodeData.type === 'caseNode' && (
              <div className="space-y-2 pt-1 border-t border-slate-800 text-slate-300">
                <p>Bureau: <span className="text-white font-semibold">{selectedNodeData.data.bureauName}</span></p>
                {selectedNodeData.data.assignedOfficer && (
                  <p>Assigned Officer: <span className="text-emerald-300 font-semibold">{selectedNodeData.data.assignedOfficer}</span></p>
                )}
                <p>Severity: <span className="text-red-400 font-semibold">{selectedNodeData.data.severityLevel}</span></p>
                <p>Status: <span className="text-blue-400 font-semibold">{selectedNodeData.data.status}</span></p>
                
                <button
                  onClick={() => navigate(`/cases/${selectedNodeData.data.id}`)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Open Full Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {selectedNodeData.type === 'institutionNode' && (
              <div className="space-y-2 pt-1 border-t border-slate-800 text-slate-300">
                <p>Location: <span className="text-white">{selectedNodeData.data.city}, {selectedNodeData.data.state}</span></p>
                <p>Risk Score: <span className="text-amber-400 font-bold">{selectedNodeData.data.riskScore}/100</span> ({selectedNodeData.data.riskCategory})</p>
                <p>Active Dossiers: <span className="text-white font-semibold">{selectedNodeData.data.activeCasesCount}</span></p>
                
                <button
                  onClick={() => navigate(`/institutions/${selectedNodeData.data.id}`)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Open 360° Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
