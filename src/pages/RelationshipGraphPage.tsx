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
  return (
    <div className={`p-3 rounded-xl border shadow-lg max-w-48 text-left transition ${
      isCritical
        ? 'bg-slate-900 border-red-500/80 shadow-red-950/40 ring-1 ring-red-500/30'
        : 'bg-slate-900 border-slate-700 shadow-slate-950/60'
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold text-blue-400 truncate">
          {data.caseNumber as string}
        </span>
        <span className={`text-[9px] font-bold px-1 rounded ${
          isCritical ? 'bg-red-950 text-red-300' : 'bg-slate-800 text-slate-300'
        }`}>
          {data.severityLevel as string}
        </span>
      </div>

      <p className="text-[11px] font-semibold text-white mt-1.5 leading-tight line-clamp-2">
        {data.title as string}
      </p>

      <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
        <span className="truncate">{data.bureauName as string}</span>
        <span className="text-blue-400 font-mono">Dossier</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
};

// Custom Node: Bureau Node
const BureauNodeComponent = ({ data }: NodeProps) => {
  return (
    <div className="p-3 rounded-xl bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 border border-blue-500/60 shadow-xl min-w-40 text-center">
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />
      <div className="flex items-center justify-center space-x-1.5 text-blue-300 mb-1">
        <Layers className="w-4 h-4" />
        <span className="font-mono font-bold text-xs">{data.code as string}</span>
      </div>
      <p className="text-xs font-bold text-white leading-tight">
        {data.name as string}
      </p>
      <p className="text-[9px] text-slate-400 mt-1 truncate">
        Head: {data.headOfficer as string}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
};

export const RelationshipGraphPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);

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
      setNodes(res.nodes);
      setEdges(res.edges);
    } catch (e) {
      console.error('Failed to load relationship graph', e);
    } finally {
      setLoading(false);
    }
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
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              Confirmed AI Link
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" />
              Suggested Link
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

      {/* Main Graph Viewport */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2 z-20">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-xs">Generating topological graph nodes & edges...</p>
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
              nodeColor={n => (n.type === 'institutionNode' ? '#3b82f6' : n.type === 'bureauNode' ? '#6366f1' : '#64748b')}
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
                <p>Severity: <span className="text-red-400 font-semibold">{selectedNodeData.data.severityLevel}</span></p>
                <p>Status: <span className="text-blue-300 font-semibold">{selectedNodeData.data.status}</span></p>

                <button
                  onClick={() => navigate(`/cases/${selectedNodeData.data.id}`)}
                  className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-center block transition shadow"
                >
                  Open Full Case Dossier
                </button>
              </div>
            )}

            {selectedNodeData.type === 'institutionNode' && (
              <div className="space-y-2 pt-1 border-t border-slate-800 text-slate-300">
                <p>Location: <span className="text-white font-semibold">{selectedNodeData.data.city}, {selectedNodeData.data.state}</span></p>
                <p>Composite Risk: <span className="text-amber-400 font-bold">{selectedNodeData.data.riskScore}/100</span></p>
                <p>Active Inquiries: <span className="text-blue-400 font-bold">{selectedNodeData.data.activeCasesCount} cases</span></p>

                <button
                  onClick={() => navigate(`/institutions/${selectedNodeData.data.id}`)}
                  className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-center block transition shadow"
                >
                  Open Institution 360° Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
