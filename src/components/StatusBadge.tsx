import React from 'react';

interface Props {
  type: 'severity' | 'status' | 'conflict' | 'risk';
  value: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ type, value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  if (type === 'severity') {
    switch (value) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-red-950/80 text-red-300 border border-red-700/60 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-500 animate-pulse"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-amber-950/70 text-amber-300 border border-amber-600/50 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
            HIGH
          </span>
        );
      case 'TIME_SENSITIVE':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-yellow-950/70 text-yellow-300 border border-yellow-600/50 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-yellow-400"></span>
            TIME-SENSITIVE
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-blue-950/60 text-blue-300 border border-blue-700/50 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-400"></span>
            NORMAL
          </span>
        );
    }
  }

  if (type === 'status') {
    switch (value) {
      case 'NEW':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-purple-950/60 text-purple-300 border border-purple-700/50 ${sizeClasses}`}>
            NEW INTAKE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 ${sizeClasses}`}>
            UNDER REVIEW
          </span>
        );
      case 'INVESTIGATION_ORDERED':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 ${sizeClasses}`}>
            INVESTIGATION ORDERED
          </span>
        );
      case 'SHOW_CAUSE_ISSUED':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-orange-950/80 text-orange-300 border border-orange-700/60 ${sizeClasses}`}>
            SHOW CAUSE ISSUED
          </span>
        );
      case 'HEARING_SCHEDULED':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-sky-950/70 text-sky-300 border border-sky-700/50 ${sizeClasses}`}>
            HEARING SCHEDULED
          </span>
        );
      case 'ACTION_TAKEN':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 ${sizeClasses}`}>
            ACTION TAKEN
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
            CLOSED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
            {value.replace(/_/g, ' ')}
          </span>
        );
    }
  }

  if (type === 'conflict') {
    switch (value) {
      case 'ACTIVE':
        return (
          <span className={`inline-flex items-center font-bold rounded-md bg-red-950/90 text-red-200 border border-red-600 ${sizeClasses}`}>
            <span className="w-2 h-2 mr-1.5 rounded-full bg-red-500 animate-ping"></span>
            ACTIVE COLLISION
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-amber-950/70 text-amber-300 border border-amber-600/50 ${sizeClasses}`}>
            ACKNOWLEDGED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-600/50 ${sizeClasses}`}>
            COORDINATED & RESOLVED
          </span>
        );
      case 'DISMISSED':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
            DISMISSED
          </span>
        );
      default:
        return <span>{value}</span>;
    }
  }

  if (type === 'risk') {
    switch (value) {
      case 'CRITICAL':
        return <span className={`font-bold text-red-400 ${sizeClasses}`}>CRITICAL RISK</span>;
      case 'HIGH':
        return <span className={`font-semibold text-amber-400 ${sizeClasses}`}>HIGH RISK</span>;
      case 'MODERATE':
        return <span className={`font-medium text-blue-400 ${sizeClasses}`}>MODERATE</span>;
      default:
        return <span className={`font-medium text-emerald-400 ${sizeClasses}`}>LOW RISK</span>;
    }
  }

  return <span>{value}</span>;
};
