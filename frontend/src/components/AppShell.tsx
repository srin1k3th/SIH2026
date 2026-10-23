import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { api } from '@/api/client';
import {
  LayoutDashboard,
  FileText,
  Scale,
  ShieldCheck,
  BarChart3,
  PlusCircle,
  Building2,
  Shield,
  FileCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { ContractMismatchBanner } from './ContractMismatchBanner';
import { DevPanel } from './DevPanel';

export function AppShell() {
  const { role, persona, setRole } = useRole();
  const location = useLocation();

  const isOfficer = role === 'officer';

  const officerNav = [
    { to: '/', label: 'Review Queue', icon: LayoutDashboard, exact: true },
    { to: '/applications', label: 'All Applications', icon: FileText },
    { to: '/rules', label: 'APH Rules Engine', icon: Scale },
    { to: '/audit', label: 'Audit Hash Chain', icon: ShieldCheck },
    { to: '/eval', label: 'Model Benchmarks', icon: BarChart3 },
  ];

  const institutionNav = [
    { to: '/applications', label: 'My Applications', icon: FileText, exact: true },
    { to: '/applications/new', label: 'Submit Application', icon: PlusCircle },
  ];

  const navItems = isOfficer ? officerNav : institutionNav;

  // Breadcrumbs title determination
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Scrutiny Review Queue';
    if (path === '/applications') return isOfficer ? 'All Applications' : 'My Applications';
    if (path === '/applications/new') return 'New Approval Submission';
    if (path.startsWith('/applications/')) return 'Application Scrutiny Detail';
    if (path.startsWith('/documents/')) return 'Document Inspection & Review';
    if (path === '/rules') return 'AICTE Approval Process Handbook (APH) Rules';
    if (path === '/audit') return 'Tamper-Evident Audit Trail';
    if (path === '/eval') return 'Detection Accuracy & Benchmark Metrics';
    return 'VeriAPH Scrutiny';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ContractMismatchBanner />

      {/* Left Sidebar */}
      <aside className="w-64 lg:w-64 max-lg:w-16 shrink-0 bg-surface border-r border-border flex flex-col justify-between transition-all duration-200 z-30">
        <div>
          {/* Logo & Subtitle */}
          <div className="h-16 px-4 flex items-center gap-3 border-b border-border overflow-hidden">
            <div className="w-9 h-9 rounded-input bg-accent flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="max-lg:hidden overflow-hidden">
              <div className="font-bold text-base tracking-tight text-primary leading-tight">
                VeriAPH
              </div>
              <div className="text-[11px] font-medium text-primary-muted truncate">
                AICTE Approval Verification
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-medium transition-colors select-none',
                      isActive
                        ? 'bg-accent/10 text-accent font-semibold'
                        : 'text-primary-muted hover:bg-slate-100 hover:text-primary'
                    )
                  }
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="max-lg:hidden truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Role Indicator */}
        <div className="p-3 border-t border-border bg-slate-50/50 max-lg:hidden">
          <div className="text-[11px] uppercase tracking-wider text-primary-muted font-semibold mb-1">
            Active Persona
          </div>
          <div className="text-xs font-semibold text-primary truncate">{persona.name}</div>
          <div className="text-[11px] text-primary-muted truncate">
            {persona.departmentOrInstitution}
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 px-6 bg-surface border-b border-border flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-lg font-semibold text-primary truncate">{getPageTitle()}</h1>
            {api.isMock && (
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-chip bg-slate-100 text-slate-700 border border-slate-200">
                Demo data
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Role Switcher Segmented Control */}
            <div className="flex items-center p-1 bg-slate-100 rounded-input border border-border text-xs">
              <button
                onClick={() => setRole('officer')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-medium transition-all select-none',
                  isOfficer
                    ? 'bg-white text-primary shadow-xs font-semibold'
                    : 'text-primary-muted hover:text-primary'
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Officer</span>
              </button>
              <button
                onClick={() => setRole('institution')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-medium transition-all select-none',
                  !isOfficer
                    ? 'bg-white text-primary shadow-xs font-semibold'
                    : 'text-primary-muted hover:text-primary'
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Institution</span>
              </button>
            </div>

            {/* User Profile Avatar / Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700 uppercase">
                {persona.name.charAt(0)}
              </div>
              <div className="text-xs text-left max-md:hidden">
                <div className="font-semibold text-primary leading-tight">{persona.name}</div>
                <div className="text-[10px] text-primary-muted capitalize">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <DevPanel />
    </div>
  );
}
