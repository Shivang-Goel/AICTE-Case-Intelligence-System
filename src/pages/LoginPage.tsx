import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Award,
  Scale,
  Siren,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface RolePreset {
  key: string;
  username: string;
  name: string;
  roleTitle: string;
  bureauName: string;
  badge: string;
  badgeColor: string;
  borderHover: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetRoute: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    key: 'CITIZEN',
    username: 'student',
    name: 'Aarav Sharma',
    roleTitle: 'Student / Complainant (Citizen)',
    bureauName: 'Public Grievance Cell & Campus SGRC',
    badge: 'Citizen / Student',
    badgeColor: 'bg-emerald-600',
    borderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/20',
    icon: GraduationCap,
    description: 'Direct citizen intake: Lodge grievances, track inquiry tokens, and view fee/safety statutory rights.',
    targetRoute: '/citizen-portal',
  },
  {
    key: 'BUREAU_OFFICER_AB',
    username: 'approval',
    name: 'Priya Ramanathan',
    roleTitle: 'Bureau Officer — Approval Bureau',
    bureauName: 'Approval Bureau (EoA & Norms)',
    badge: 'Approval Bureau',
    badgeColor: 'bg-blue-600',
    borderHover: 'hover:border-blue-500 hover:shadow-blue-500/20',
    icon: Award,
    description: 'Extension of Approval (EoA), sanction intake seats, review faculty-student cadre ratios and campus built-up norms.',
    targetRoute: '/dashboard',
  },
  {
    key: 'BUREAU_OFFICER_PGC',
    username: 'grievance',
    name: 'Smt. Ananya Sen',
    roleTitle: 'Bureau Officer — Public Grievance Cell',
    bureauName: 'Public Grievance Cell (Fees & Marksheets)',
    badge: 'Grievance Cell',
    badgeColor: 'bg-teal-600',
    borderHover: 'hover:border-teal-500 hover:shadow-teal-500/20',
    icon: Scale,
    description: 'Enforce mandatory 7-day fee refunds, order return of withheld original marksheets, and convene Lok Adalats.',
    targetRoute: '/dashboard',
  },
  {
    key: 'BUREAU_OFFICER_ARMC',
    username: 'vigilance',
    name: 'Shri Vikram Malhotra',
    roleTitle: 'Bureau Officer — Anti-Ragging & Vigilance',
    bureauName: 'Anti-Ragging & Vigilance War Room',
    badge: 'Vigilance & Safety',
    badgeColor: 'bg-red-600',
    borderHover: 'hover:border-red-500 hover:shadow-red-500/20',
    icon: Siren,
    description: 'Zero-tolerance safety enforcement: Deploy 24h unannounced flying squads, lodge police FIRs, and probe forged certificates.',
    targetRoute: '/dashboard',
  },
  {
    key: 'ADMIN',
    username: 'admin',
    name: 'Dr. Arvind Sharma',
    roleTitle: 'Chief Regulatory Officer (Council Admin)',
    bureauName: 'Central Council Executive Headquarters',
    badge: 'Council Admin',
    badgeColor: 'bg-purple-600',
    borderHover: 'hover:border-purple-500 hover:shadow-purple-500/20',
    icon: Shield,
    description: 'Full statutory jurisdiction across all 4 bureaus, automated duplicate detection, cross-bureau conflicts, and audit trail.',
    targetRoute: '/dashboard',
  },
  {
    key: 'REVIEWER',
    username: 'reviewer',
    name: 'Rajesh Deshmukh',
    roleTitle: 'Regulatory Reviewer & Ombudsman',
    bureauName: 'Ombudsman & Intelligence Docket',
    badge: 'AI Reviewer',
    badgeColor: 'bg-amber-600',
    borderHover: 'hover:border-amber-500 hover:shadow-amber-500/20',
    icon: Sparkles,
    description: 'Review and adjudicate AI case linking suggestions, resolve inter-bureau jurisdiction disputes and contradictions.',
    targetRoute: '/dashboard',
  },
  {
    key: 'READONLY_MANAGEMENT',
    username: 'executive',
    name: 'Sunita Verma',
    roleTitle: 'Executive Management (Board Observer)',
    bureauName: 'Apex Advisory & Planning Board',
    badge: 'Executive',
    badgeColor: 'bg-indigo-600',
    borderHover: 'hover:border-indigo-500 hover:shadow-indigo-500/20',
    icon: BarChart3,
    description: 'Macro national telemetry: All-India risk heatmaps, regional violation benchmarks, and statutory annual reports.',
    targetRoute: '/dashboard',
  },
];

interface Props {
  onLoginSuccess?: (user: UserType) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const performLogin = async (usr: string, pwd: string, targetPath?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.login(usr, pwd);
      setSuccessMsg(`Welcome, ${res.user.name}!`);

      if (onLoginSuccess) {
        onLoginSuccess(res.user);
      }

      // Determine navigation route
      let route = targetPath;
      if (!route) {
        if (res.user.role === 'CITIZEN') {
          route = '/citizen-portal';
        } else if (res.user.role === 'REVIEWER') {
          route = '/linking';
        } else if (res.user.role === 'READONLY_MANAGEMENT') {
          route = '/analytics';
        } else {
          route = '/dashboard';
        }
      }

      setTimeout(() => {
        navigate(route || '/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    performLogin(username.trim(), password.trim());
  };

  const handleQuickLogin = (preset: RolePreset) => {
    setUsername(preset.username);
    setPassword('demo123');
    performLogin(preset.username, 'demo123', preset.targetRoute);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top National Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center border border-blue-500/40 shadow-xl shadow-blue-900/20">
            <Shield className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-tight text-white">
                CaseSetu <span className="text-blue-400 font-bold text-xs px-1.5 py-0.5 rounded bg-blue-950/90 border border-blue-800/60">AICTE</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono text-[10px]">
                Statutory Regulatory Hub (SIH26264)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              CaseSetu • Institutional Case Intelligence & Risk Assessment Bridge for AICTE
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/citizen-portal')}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition shadow"
        >
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>CaseSetu Student Portal</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto my-auto py-4">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase tracking-widest">
            CaseSetu — Connect Cases. Detect Risks. Prioritize Action.
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Sign In to CaseSetu
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Multi-bureau statutory case intelligence for Approval Bureau, Public Grievance Cell, Anti-Ragging Monitoring Cell, AI Ombudsman, and Council Administration.
          </p>
        </div>

        {/* Credentials Callout Card */}
        <div className="max-w-md mx-auto mb-6 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2.5">
            <KeyRound className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-white text-[11px]">Demo Password for All Roles:</p>
              <p className="font-mono text-emerald-300 font-bold text-sm tracking-wider">demo123</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
            Click any card below for 1-Click Login
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Manual Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>Account Credentials</span>
              </h2>
              <p className="text-xs text-slate-400">
                Enter your username and password or select a role preset.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{successMsg} Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Username / Persona Code</span>
                  <span className="text-[10px] text-slate-500 font-normal lowercase">e.g. student, approval, admin</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username (e.g. student, approval, admin)..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Password</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Default: demo123</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password (demo123)..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Authenticating User...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick helper list of usernames */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-semibold text-slate-300 block uppercase text-[10px] tracking-wider">
                Supported Easy Usernames (Password: demo123):
              </span>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-emerald-300">student (Citizen)</span>
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-blue-300">approval (Approval)</span>
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-teal-300">grievance (PGC)</span>
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-red-300">vigilance (Safety)</span>
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-purple-300">admin (Council)</span>
                <span className="p-1 rounded bg-slate-950 border border-slate-800 text-amber-300">reviewer (AI Link)</span>
              </div>
            </div>
          </div>

          {/* Right Column: 1-Click Role Presets Grid (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Interactive 1-Click Role Logins</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select any statutory persona to instantly sign in with pre-configured access.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_PRESETS.map(preset => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleQuickLogin(preset)}
                    className={`text-left p-3.5 rounded-xl bg-slate-900 border border-slate-800 ${preset.borderHover} transition-all shadow hover:shadow-lg flex flex-col justify-between group space-y-2`}
                  >
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 group-hover:scale-105 transition`}>
                            <Icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <span className="font-bold text-white text-xs">{preset.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold text-slate-200">{preset.roleTitle}</p>
                        <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 w-full text-[10px]">
                      <span className="font-mono text-slate-400">
                        Username: <code className="text-blue-300 font-bold">{preset.username}</code>
                      </span>
                      <span className="font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-0.5">
                        <span>Sign In</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-6 border-t border-slate-800/80 mt-8 space-y-1">
        <p>AICTE Case Intelligence & Risk Assessment Platform • Smart India Hackathon (SIH26264)</p>
        <p className="text-[11px] text-slate-600">
          Permanent ID Cross-Referencing, Multi-Bureau Collision Prevention & Citizen Grievance Gateway.
        </p>
      </footer>
    </div>
  );
};
