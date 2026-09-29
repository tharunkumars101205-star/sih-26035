import React, { useState } from 'react';
import {
  Scale,
  LayoutDashboard,
  ClipboardList,
  FlaskConical,
  Calculator,
  FileCheck,
  FolderArchive,
  History,
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  Plus,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building2,
  FileText,
} from 'lucide-react';
import { UserRole } from '../../types';
import { storageService } from '../../services/storageService';

interface AppLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(storageService.getCurrentUser());
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const handleRoleChange = (role: UserRole) => {
    const updated = storageService.setCurrentUserRole(role);
    setCurrentUser(updated);
    setRoleMenuOpen(false);
  };

  const navGroups = [
    {
      group: 'Core Operations',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Instrument Registry', path: '/instruments', icon: Scale },
        { label: 'Evaluations Register', path: '/evaluations', icon: ClipboardList },
        { label: 'Test Execution', path: '/test-execution', icon: FlaskConical },
        { label: 'Calculations & MPE', path: '/calculations', icon: Calculator },
      ],
    },
    {
      group: 'Review & Reporting',
      items: [
        { label: 'Technical Review', path: '/reviews', icon: UserCheck, countBadge: currentUser.role === 'technical_reviewer' ? '1' : undefined },
        { label: 'Evidence & Documents', path: '/evidence', icon: FolderArchive },
        { label: 'Standardized Reports', path: '/reports', icon: FileCheck },
        { label: 'Traceability & History', path: '/history', icon: History },
      ],
    },
    {
      group: 'Governance & Knowledge',
      items: [
        { label: 'Regulatory Rules Library', path: '/rules', icon: BookOpen },
        { label: 'Laboratory Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Lab Configuration', path: '/settings', icon: Settings },
        { label: 'Architecture & Docs', path: '/documentation', icon: FileText },
      ],
    },
  ];

  // Derive breadcrumbs
  const getBreadcrumb = () => {
    if (currentPath === '/' || currentPath === '/dashboard') return 'Laboratory Dashboard';
    if (currentPath.startsWith('/instruments/new')) return 'Instruments / Register New NAWI';
    if (currentPath.startsWith('/instruments/')) return 'Instruments / Specification & History';
    if (currentPath.startsWith('/instruments')) return 'Instruments Registry';
    if (currentPath.startsWith('/evaluations/new')) return 'Evaluations / New Type Evaluation Wizard';
    if (currentPath.startsWith('/evaluations/')) return 'Evaluations / Evaluation Plan';
    if (currentPath.startsWith('/evaluations')) return 'Evaluations Register';
    if (currentPath.startsWith('/test-execution/')) return 'Test Execution / Observation Workbench';
    if (currentPath.startsWith('/test-execution')) return 'Test Execution';
    if (currentPath.startsWith('/calculations/')) return 'Calculations / Detailed MPE Breakdown';
    if (currentPath.startsWith('/calculations')) return 'Calculations & Tolerance Engine';
    if (currentPath.startsWith('/reviews')) return 'Technical Review Workspace';
    if (currentPath.startsWith('/evidence')) return 'Evidence & Supporting Documents';
    if (currentPath.startsWith('/reports/')) return 'Reports / Standardized Report View';
    if (currentPath.startsWith('/reports')) return 'Standardized Report Repository';
    if (currentPath.startsWith('/history')) return 'Instrument-wise Traceability History';
    if (currentPath.startsWith('/rules')) return 'OIML Regulatory Rule Library';
    if (currentPath.startsWith('/analytics')) return 'Laboratory Operations Analytics';
    if (currentPath.startsWith('/settings')) return 'Settings & Laboratory Configuration';
    if (currentPath.startsWith('/documentation')) return 'System Architecture & Technical Manual';
    return 'Metrology Workbench';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-200 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950">
          <button
            onClick={() => {
              onNavigate('/dashboard');
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-white font-bold shadow-xs">
              <Scale size={20} />
            </div>
            <div>
              <div className="font-bold tracking-tight text-white flex items-center gap-2">
                <span>METRALAB</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  SIH26035
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-normal">
                OIML R 76 NAWI Testing
              </div>
            </div>
          </button>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Hackathon Team Marker */}
        <div className="mx-4 mt-3 px-3 py-2 rounded bg-slate-900/90 border border-slate-800/80 text-xs">
          <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
            Smart India Hackathon 2026
          </div>
          <div className="text-slate-300 font-medium mt-0.5 flex items-center justify-between">
            <span>Ministry of Consumer Affairs</span>
            <span className="text-slate-400 font-mono text-[10px]">Black Squad</span>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/dashboard'
                    ? currentPath === '/' || currentPath === '/dashboard'
                    : currentPath.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.countBadge && (
                      <span className="bg-amber-500 text-slate-950 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {item.countBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card & Role Switcher */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="h-8 w-8 rounded-full bg-cyan-900 text-cyan-200 border border-cyan-700/50 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.avatarInitials}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-cyan-400 font-mono capitalize truncate">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600 font-medium">
              <span className="text-slate-400">METRALAB</span>
              <ChevronRight size={14} className="text-slate-400" />
              <span className="text-slate-900 font-semibold">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Switcher Pill / Button */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 transition-colors text-slate-700"
                title="Switch simulated user role for testing approval and review workflows"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline text-slate-500">Role:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white p-2 shadow-xl border border-slate-200 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-slate-900 border-b border-slate-100">
                    Simulate Role (Demo Testing)
                  </div>
                  <div className="p-2 text-[11px] text-amber-700 bg-amber-50 rounded mt-1 mb-2 border border-amber-200">
                    <ShieldAlert size={12} className="inline mr-1" />
                    Switching roles allows evaluating all perspectives: data entry, technical review, and administration.
                  </div>
                  <div className="space-y-1">
                    {[
                      {
                        role: 'testing_engineer' as UserRole,
                        label: 'Testing Engineer',
                        desc: 'Record observations, enter raw test points, submit evaluations',
                      },
                      {
                        role: 'technical_reviewer' as UserRole,
                        label: 'Technical Reviewer',
                        desc: 'Inspect MPE curves, verify compliance, approve/request fixes',
                      },
                      {
                        role: 'laboratory_admin' as UserRole,
                        label: 'Laboratory Administrator',
                        desc: 'Configure lab accreditation, standard weights, and rules',
                      },
                    ].map((item) => (
                      <button
                        key={item.role}
                        onClick={() => handleRoleChange(item.role)}
                        className={`w-full text-left p-2 rounded transition-colors ${
                          currentUser.role === item.role
                            ? 'bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: New Evaluation */}
            <button
              onClick={() => onNavigate('/evaluations/new')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus size={14} />
              <span>New Evaluation</span>
            </button>
          </div>
        </header>

        {/* Secondary Subheader / Traceability Ribbon */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 md:px-8 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Official Framework:</span>
            <span>OIML R 76-1 (2006)</span>
            <span className="text-slate-400">·</span>
            <span>Legal Metrology Act, 2009</span>
            <span className="text-slate-400">·</span>
            <span>Rules 2011 (7th Schedule)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Accuracy Classes: I, II, III, IIII</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-emerald-700 font-medium">Traceability: NABL / NPL India</span>
          </div>
        </div>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
