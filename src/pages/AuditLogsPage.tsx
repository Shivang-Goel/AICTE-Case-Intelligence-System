import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Download,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [search, roleFilter, entityFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.actorRole = roleFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.getAuditLogs(params);
      setLogs(res.auditLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/v1/audit-logs-export/csv';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-blue-400" />
            Statutory Regulatory Audit Trail & Procedural Ledger
          </h1>
          <p className="text-xs text-slate-400">
            Immutable, append-only chronological record of all case actions, officer decisions, AI link confirmations, and status transitions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, actor, or details..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Actor Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="BUREAU_OFFICER">BUREAU OFFICER</option>
            <option value="REVIEWER">REVIEWER</option>
            <option value="SYSTEM">SYSTEM (AI Engines)</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Entity Domains</option>
            <option value="CASE">Case / Complaint</option>
            <option value="RELATIONSHIP">AI Relationship</option>
            <option value="CONFLICT">Cross-Bureau Conflict</option>
            <option value="SEVERITY">Severity Assessment</option>
            <option value="USER">User / Auth</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs">Verifying cryptographic hash of audit log records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Domain Entity</th>
                  <th className="py-3 px-4">Procedural Details</th>
                  <th className="py-3 px-4">Network IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white block">{log.actorName}</span>
                      <span className="text-[10px] text-blue-400 font-mono">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold text-[10px] border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      <span className="text-indigo-400 font-mono text-[11px] block">{log.entityType}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                        {log.entityReference || log.entityId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md">
                      <p className="leading-snug">{log.details}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
