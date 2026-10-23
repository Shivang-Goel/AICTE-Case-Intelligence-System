import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, linkTo?: string) => {
    await api.markNotificationRead(id);
    loadNotifications();
    if (linkTo) navigate(linkTo);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    loadNotifications();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            Intelligence Alerts & Procedural Notifications
          </h1>
          <p className="text-xs text-slate-400">
            Real-time automated alerts for critical student safety cases, cross-bureau conflicts, and impending deadlines.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Check className="w-3.5 h-3.5 text-blue-400" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Querying notification queue...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">All caught up!</p>
          <p className="text-xs text-slate-500">No unhandled system or intelligence alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const isSafety = n.type === 'URGENT_SAFETY';
            const isConflict = n.type === 'CONFLICT_DETECTED';

            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id, n.linkTo)}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                  !n.read
                    ? isSafety
                      ? 'bg-red-950/40 border-red-700/80 shadow-md'
                      : isConflict
                      ? 'bg-amber-950/30 border-amber-700/70 shadow-md'
                      : 'bg-slate-850 border-blue-500/50 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                    isSafety ? 'bg-red-600/30 text-red-400' :
                    isConflict ? 'bg-amber-600/30 text-amber-400' : 'bg-blue-600/30 text-blue-400'
                  }`}>
                    {isSafety ? <Flame className="w-5 h-5 animate-pulse" /> :
                     isConflict ? <AlertTriangle className="w-5 h-5" /> :
                     <Sparkles className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${
                        isSafety ? 'text-red-300' : isConflict ? 'text-amber-300' : 'text-blue-300'
                      }`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-200 leading-snug">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {n.linkTo && (
                  <button className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center space-x-1 flex-shrink-0 pt-1">
                    <span>View Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
