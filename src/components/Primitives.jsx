import { AlertTriangle, Check, Info, Loader2, Search, X } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title mt-2">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    purple: 'bg-violet-100 text-violet-700',
    teal: 'bg-teal-100 text-teal-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700'
  };
  return <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone] || tones.slate}`}>{children}</span>;
}

export function LoadingState({ label = 'Loading live records…' }) {
  return <div className="surface flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center"><Loader2 className="h-7 w-7 animate-spin text-[#6f4abd]" /><p className="text-sm font-semibold text-slate-600">{label}</p></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="surface flex min-h-[220px] flex-col items-center justify-center gap-3 border-rose-200 bg-rose-50/60 p-8 text-center"><AlertTriangle className="h-7 w-7 text-rose-500" /><p className="max-w-xl text-sm font-semibold text-rose-800">{message}</p>{onRetry && <button className="btn-secondary" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title = 'No matching records', message = 'Adjust your filters or search terms to explore the live database.' }) {
  return <div className="flex min-h-[190px] flex-col items-center justify-center gap-2 p-8 text-center"><Search className="h-7 w-7 text-slate-300" /><p className="text-sm font-bold text-slate-700">{title}</p><p className="max-w-md text-xs leading-5 text-slate-500">{message}</p></div>;
}

export function InfoNote({ children, tone = 'blue' }) {
  const styles = tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-100 bg-blue-50 text-blue-900';
  return <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${styles}`}><Info className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>;
}

export function Modal({ title, onClose, children, width = 'max-w-2xl' }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"><div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lift sm:rounded-2xl sm:p-7 ${width}`}><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-bold tracking-[-0.03em] text-slate-950">{title}</h2><button className="btn-ghost" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

export function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return <div className={`fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-40px)] items-start gap-3 rounded-2xl border px-4 py-3 shadow-lift ${isError ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}><span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full ${isError ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>{isError ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}</span><div className="text-sm font-semibold leading-5">{toast.message}</div><button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button></div>;
}

export function SearchInput({ value, onChange, placeholder = 'Search records…' }) {
  return <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="input pl-10" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>;
}

export function StatCard({ label, value, detail, icon: Icon, accent = 'purple' }) {
  const accents = { purple: 'bg-violet-50 text-violet-700', teal: 'bg-teal-50 text-teal-700', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700' };
  return <div className="surface flex items-start justify-between p-5"><div><div className="eyebrow">{label}</div><div className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950">{value}</div><div className="mt-1 text-xs text-slate-500">{detail}</div></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${accents[accent] || accents.purple}`}><Icon className="h-5 w-5" /></div></div>;
}

export function TableFrame({ children }) {
  return <div className="surface data-table-wrap">{children}</div>;
}

export function Field({ label, value, onChange, placeholder, type = 'text', required = false, multiline = false }) {
  const props = { className: 'input', value: value ?? '', onChange: (event) => onChange(event.target.value), placeholder, required };
  return <label className="block"><span className="label">{label}{required && <span className="text-rose-500"> *</span>}</span>{multiline ? <textarea {...props} rows={4} /> : <input {...props} type={type} />}</label>;
}
