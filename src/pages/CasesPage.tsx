import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { ComplaintCase, Bureau } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [bureauFilter, setBureauFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBureaus();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [search, bureauFilter, severityFilter, statusFilter, categoryFilter, sortBy, sortOrder, page]);

  const fetchBureaus = async () => {
    try {
      const res = await api.getDashboardData();
      // Use bureaus from dashboard
      const bList = res.bureauWorkload.map(b => ({
        id: b.bureauId,
        code: b.code,
        name: b.name,
        description: '',
        headOfficer: '',
        activeCasesCount: b.active,
      }));
      setBureaus(bList);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: '15',
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (bureauFilter) params.bureauId = bureauFilter;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.getCases(params);
      setCases(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalCount(res.pagination.totalCount || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints list.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = '/api/v1/cases-export/csv';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Centralized Complaint & Case Registry
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {totalCount} Total Cases
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Multi-bureau repository with automated AI triage, deadline tracking, and regulatory cross-referencing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/intake')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by case number, title, institution, or officer..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Bureau Filter */}
          <div>
            <select
              value={bureauFilter}
              onChange={e => {
                setBureauFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Bureaus & Cells</option>
              {bureaus.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={e => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Severity Levels</option>
              <option value="CRITICAL">CRITICAL (Immediate safety risk)</option>
              <option value="HIGH">HIGH (Regulatory/Fraud breach)</option>
              <option value="TIME_SENSITIVE">TIME-SENSITIVE (Cutoff/Court stay)</option>
              <option value="NORMAL">NORMAL (Standard inquiry)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters: Status & Category */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              Quick Filters:
            </span>
            <button
              onClick={() => {
                setStatusFilter('');
                setSeverityFilter('');
                setCategoryFilter('');
                setBureauFilter('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                !statusFilter && !severityFilter && !categoryFilter && !bureauFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                severityFilter === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-950/40 text-red-300 border border-red-800/40 hover:bg-red-900/50'
              }`}
            >
              Critical Safety Only
            </button>
            <button
              onClick={() => setStatusFilter('INVESTIGATION_ORDERED')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                statusFilter === 'INVESTIGATION_ORDERED'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Investigation Ordered
            </button>
            <button
              onClick={() => setStatusFilter('SHOW_CAUSE_ISSUED')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                statusFilter === 'SHOW_CAUSE_ISSUED'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Show Cause Issued
            </button>
          </div>

          {/* Sort By Toggle */}
          <div className="flex items-center space-x-2 text-slate-400">
            <span>Sort:</span>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs">Querying AICTE case database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No cases found matching filter criteria.</p>
            <p className="text-xs text-slate-500">Try broadening your search query or reset filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Number</th>
                  <th className="py-3 px-4">Subject & Allegation</th>
                  <th className="py-3 px-4">Institution & Permanent ID</th>
                  <th className="py-3 px-4">Bureau</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Investigating Officer</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {cases.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-slate-850 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-white truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.description}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-slate-200 font-medium">{c.institutionName}</p>
                      <p className="text-[10px] font-mono text-slate-400">{c.permanentId}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {c.bureauName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge type="severity" value={c.severityLevel} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge type="status" value={c.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {c.assignedOfficer}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(c.deadlineDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/cases/${c.id}`);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, totalCount)} of {totalCount} records
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="font-semibold text-white">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
