import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  FileText,
  Building2,
  Layers,
  PieChart as PieIcon,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import { DashboardData } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardData();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/v1/cases-export/csv';
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Aggregating national technical education regulatory analytics...</p>
      </div>
    );
  }

  const { bureauWorkload, categoryDistribution, regionalSummary, severityDistribution, kpis } = data;

  const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Executive Regulatory Analytics & Intelligence Reports
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-bureau metrics recalculated directly from PostgreSQL authoritative records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow text-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Total Regulatory Inquiries</span>
          <p className="text-2xl font-black text-white">{kpis.totalCases}</p>
          <p className="text-slate-500 text-[10px]">Active across 5 AICTE cells</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow text-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Disposal / Resolution Rate</span>
          <p className="text-2xl font-black text-emerald-400">
            {Math.round(((kpis.totalCases - kpis.openCases) / Math.max(1, kpis.totalCases)) * 100)}%
          </p>
          <p className="text-slate-500 text-[10px]">{kpis.totalCases - kpis.openCases} cases resolved</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow text-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Cross-Bureau Conflict Index</span>
          <p className="text-2xl font-black text-amber-400">{kpis.activeConflicts} Active</p>
          <p className="text-slate-500 text-[10px]">Mitigating uncoordinated orders</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow text-xs space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Monitored High Risk Campus</span>
          <p className="text-2xl font-black text-red-400">{kpis.highRiskInstitutions}</p>
          <p className="text-slate-500 text-[10px]">Risk score &gt;= 70/100</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Grievance Classification Distribution
            </h3>
            <p className="text-xs text-slate-400">Total complaints categorized by subject domain</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={120} tickFormatter={v => v.replace(/_/g, ' ')} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Complaints" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              State / Regional Distribution
            </h3>
            <p className="text-xs text-slate-400">Concentration of active investigations by state jurisdiction</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="region" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="caseCount" fill="#10b981" radius={[4, 4, 0, 0]} name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bureau Performance Breakdown Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Statutory Bureau Throughput & Performance Summary
          </h3>
          <p className="text-xs text-slate-400">Comparative assessment across AICTE regulatory divisions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Bureau / Statutory Cell</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Total Dossiers</th>
                <th className="py-3 px-4">Active Inquiries</th>
                <th className="py-3 px-4">Critical Safety</th>
                <th className="py-3 px-4">Disposed / Resolved</th>
                <th className="py-3 px-4">Clearance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {bureauWorkload.map(b => {
                const rate = Math.round((b.resolved / Math.max(1, b.total)) * 100);
                return (
                  <tr key={b.bureauId} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-4 font-bold text-white">{b.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{b.code}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{b.total}</td>
                    <td className="py-3 px-4 font-mono text-blue-400 font-bold">{b.active}</td>
                    <td className="py-3 px-4 font-mono text-red-400 font-bold">{b.critical}</td>
                    <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{b.resolved}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
