import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Database, Dna, FlaskConical, LayoutDashboard, LogIn, Menu, Network, PanelLeftClose, ShieldCheck, X } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/drugs', label: 'Drug Explorer', icon: FlaskConical },
  { to: '/genes', label: 'Gene Explorer', icon: Dna },
  { to: '/interactions', label: 'Drug–Gene Interactions', icon: Network },
  { to: '/references', label: 'Scientific References', icon: BookOpen }
];

function Brand({ compact = false }) {
  return <div className={`flex items-center gap-3 ${compact ? 'px-1' : 'px-1'}`}><div className="brand-mark"><span>PG</span></div><div><div className="text-[15px] font-extrabold tracking-[-0.04em] text-white">PharmacoGene</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Evidence workspace</div></div></div>;
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const close = () => setOpen(false);
  return <div className="min-h-screen bg-[#f7f9fc]">
    <div className={`mobile-overlay fixed inset-0 z-30 bg-slate-950/50 md:hidden ${open ? 'open' : ''}`} onClick={close} />
    <aside className={`mobile-sidebar sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col overflow-y-auto bg-[#091d3a] px-4 py-5 shadow-2xl md:translate-x-0 ${open ? 'open' : ''}`}>
      <div className="flex items-center justify-between"><Brand /><button onClick={close} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white md:hidden"><X className="h-4 w-4" /></button></div>
      <div className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</div>
      <nav className="mt-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={close} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-white/12 text-white shadow-sm' : 'text-slate-400 hover:bg-white/6 hover:text-slate-100'}`}><Icon className="h-[18px] w-[18px] shrink-0" /><span>{label}</span></NavLink>)}
      </nav>
      <div className="mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Governance</div>
      <nav className="mt-3 space-y-1"><NavLink to="/admin/login" onClick={close} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive || location.pathname.startsWith('/admin') ? 'bg-white/12 text-white' : 'text-slate-400 hover:bg-white/6 hover:text-slate-100'}`}><ShieldCheck className="h-[18px] w-[18px]" /><span>Admin Login</span></NavLink></nav>
      <div className="mt-auto pt-10"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-2 text-xs font-bold text-teal-300"><span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_0_4px_rgba(94,234,212,.12)]" />Live dataset</div><p className="mt-2 text-xs leading-5 text-slate-400">Connected to the verified Supabase knowledgebase. Educational and research use only.</p></div><div className="mt-5 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"><Database className="h-3.5 w-3.5" /> Supabase source</div></div>
    </aside>
    <div className="md:pl-[264px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 md:hidden" onClick={() => setOpen(true)}><Menu className="h-4 w-4" /></button><div className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex"><span>Research workspace</span><span className="text-slate-300">/</span><span className="text-slate-700">{navItems.find((item) => item.to === location.pathname)?.label || (location.pathname.startsWith('/admin') ? 'Administration' : 'Record detail')}</span></div></div><div className="flex items-center gap-2"><button className="btn-ghost hidden sm:inline-flex" onClick={() => navigate('/references')}><BookOpen className="h-4 w-4" /> Evidence library</button><button className="btn-secondary !px-3 !py-2" onClick={() => navigate('/admin/login')}><LogIn className="h-4 w-4" /><span className="hidden sm:inline">Admin access</span></button></div></header>
      <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9"><Outlet /></main>
    </div>
  </div>;
}
