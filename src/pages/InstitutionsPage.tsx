import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Filter,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api';
import { Institution } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const InstitutionsPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadInstitutions();
  }, [search, stateFilter, riskFilter]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (stateFilter) params.state = stateFilter;
      if (riskFilter) params.riskCategory = riskFilter;

      const res = await api.getInstitutions(params);
      setInstitutions(res.institutions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const states = Array.from(new Set(institutions.map(i => i.state))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            AICTE Monitored Institutions Directory
          </h1>
          <p className="text-xs text-slate-400">
            Centrally indexed technical colleges, universities, and polytechnics with Permanent ID cross-bureau risk profiling.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by college name, city, or AICTE ID..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All States & Regions</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Risk Profiles</option>
            <option value="CRITICAL">CRITICAL RISK</option>
            <option value="HIGH">HIGH RISK</option>
            <option value="MODERATE">MODERATE RISK</option>
            <option value="LOW">LOW RISK</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Loading institutional risk profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map(inst => (
            <div
              key={inst.id}
              onClick={() => navigate(`/institutions/${inst.id}`)}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-xl p-5 cursor-pointer transition shadow-md hover:shadow-xl hover:bg-slate-850 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800/80">
                    {inst.permanentId}
                  </span>
                  <StatusBadge type="risk" value={inst.riskCategory} />
                </div>

                <h3 className="text-sm font-bold text-white hover:text-blue-300 transition line-clamp-2">
                  {inst.name}
                </h3>

                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{inst.city}, {inst.state}</span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">{inst.type}</span>
                  <span>Intake: {inst.approvedIntake}</span>
                  {inst.naacGrade && <span>NAAC: {inst.naacGrade}</span>}
                </div>
              </div>

              {/* Bottom statistics */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Composite Risk Score:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-mono font-bold text-white text-sm">{inst.riskScore}</span>
                    <span className="text-slate-500 text-[10px]">/ 100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Investigations:</span>
                  <span className="font-mono font-bold text-blue-400">{inst.activeCasesCount} open</span>
                </div>

                {inst.hasActiveConflict && (
                  <div className="p-1.5 rounded bg-red-950/70 border border-red-700/60 text-[10px] text-red-300 flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span>Cross-Bureau Conflict Alert</span>
                  </div>
                )}

                <div className="flex items-center justify-end text-xs font-semibold text-blue-400 pt-1">
                  <span>Open 360° Profile</span>
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
