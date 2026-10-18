import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Database, Edit3, ExternalLink, FlaskConical, LogOut, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDataset } from '../App';
import { checkAdminMembership, deleteRecord, replaceInteractionReferences, saveRecord, supabase } from '../lib/api';
import { Badge, EmptyState, Field, InfoNote, Modal, PageHeader, SearchInput, TableFrame, Toast } from '../components/Primitives';

const tabs = [
  { key: 'drugs', label: 'Drugs', icon: FlaskConical },
  { key: 'genes', label: 'Genes', icon: ShieldCheck },
  { key: 'interactions', label: 'Interactions', icon: Database },
  { key: 'references', label: 'References', icon: ExternalLink }
];

const configs = {
  drugs: {
    title: 'Manage drugs',
    table: 'drugs',
    fields: [
      ['name', 'Drug name', true], ['drug_class', 'Drug class', false], ['source_name', 'Source name', false], ['source_url', 'Source URL', false], ['validation_status', 'Validation status', false]
    ],
    columns: ['name', 'drug_class', 'validation_status']
  },
  genes: {
    title: 'Manage genes',
    table: 'genes',
    fields: [
      ['symbol', 'Gene symbol', true], ['full_name', 'Full gene name', false], ['chromosome', 'Chromosome', false], ['source_name', 'Source name', false], ['source_url', 'Source URL', false], ['validation_status', 'Validation status', false]
    ],
    columns: ['symbol', 'full_name', 'chromosome', 'validation_status']
  },
  references: {
    title: 'Manage references',
    table: 'scientific_references',
    fields: [
      ['gene_symbol', 'Gene symbol', false], ['title', 'Reference title', true], ['source_organization', 'Source organization', false], ['url', 'Source URL', false], ['validation_status', 'Validation status', false]
    ],
    columns: ['title', 'source_organization', 'gene_symbol', 'validation_status']
  },
  interactions: {
    title: 'Manage interactions',
    table: 'drug_gene_interactions',
    fields: [
      ['association_type', 'Association type', true], ['clinical_implication', 'Clinical implication', false], ['phenotype', 'Phenotype', false], ['allele_or_genotype', 'Allele or genotype', false], ['evidence_level', 'Evidence level', false], ['review_status', 'Review status', false], ['source_url', 'Source URL', false]
    ],
    columns: ['gene_id', 'drug_id', 'association_type', 'review_status']
  }
};

function blankForm(kind) {
  const values = {};
  configs[kind].fields.forEach(([key]) => { values[key] = ''; });
  if (kind === 'interactions') { values.gene_id = ''; values.drug_id = ''; }
  return values;
}

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (!supabase) { setError('Supabase is not configured. Add the environment variables before using admin access.'); return; }
    setState('loading'); setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword(form);
    if (signInError) { setState('idle'); setError(signInError.message); return; }
    const membership = await checkAdminMembership(data.user);
    if (!membership.allowed) { await supabase.auth.signOut(); setState('idle'); setError('Authentication succeeded, but this account is not authorized in admin_users. Ask an administrator to provision it and ensure RLS permits the membership check.'); return; }
    navigate('/admin');
  };
  return <div className="flex min-h-screen items-center justify-center bg-[#091d3a] px-5 py-10"><div className="w-full max-w-md"><Link to="/" className="mb-8 inline-flex items-center gap-3"><div className="brand-mark"><span>PG</span></div><div><div className="text-[15px] font-extrabold tracking-[-0.04em] text-white">PharmacoGene</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">Evidence workspace</div></div></Link><div className="rounded-3xl bg-white p-6 shadow-lift sm:p-8"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><ShieldCheck className="h-6 w-6" /></div><div className="mt-6 eyebrow">Restricted area</div><h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-slate-950">Admin Login</h1><p className="mt-3 text-sm leading-6 text-slate-500">Sign in with an existing Supabase Authentication account. Membership is verified against the existing <code className="rounded bg-slate-100 px-1">admin_users</code> table; there is no public registration.</p>{error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold leading-5 text-rose-800">{error}</div>}<form onSubmit={submit} className="mt-6 space-y-4"><Field label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required /><Field label="Password" type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} required /><button className="btn-primary mt-2 w-full" disabled={state === 'loading'}>{state === 'loading' ? 'Verifying…' : 'Sign in securely'} <ShieldCheck className="h-4 w-4" /></button></form><Link to="/" className="btn-ghost mt-4 w-full"><ArrowLeft className="h-4 w-4" /> Return to public workspace</Link></div><p className="mt-5 text-center text-xs leading-5 text-slate-400">Admin actions are still subject to Supabase Row Level Security policies. Failed writes are reported instead of bypassed.</p></div></div>;
}

export function AdminGuard({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState('checking');
  const [reason, setReason] = useState('');
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!supabase) { setState('denied'); setReason('Supabase is not configured.'); return; }
      const { data } = await supabase.auth.getSession();
      if (!data.session) { navigate('/admin/login', { replace: true }); return; }
      const membership = await checkAdminMembership(data.session.user);
      if (!active) return;
      if (!membership.allowed) { setState('denied'); setReason('This authenticated account is not listed in admin_users.'); } else setState('ready');
    };
    run();
    return () => { active = false; };
  }, [navigate]);
  if (state === 'checking') return <div className="surface mx-auto max-w-xl p-10 text-center"><div className="eyebrow">Authorization</div><h1 className="mt-2 text-2xl font-bold text-slate-950">Checking administrator membership…</h1></div>;
  if (state === 'denied') return <div className="surface mx-auto max-w-xl p-7 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-rose-500" /><h1 className="mt-4 text-2xl font-bold text-slate-950">Admin access denied</h1><p className="mt-2 text-sm leading-6 text-slate-500">{reason} Authentication alone is not enough to access this panel.</p><Link to="/" className="btn-secondary mt-6">Return to dashboard</Link></div>;
  return children;
}

export function AdminPage() {
  const { dataset, refresh } = useDataset();
  const navigate = useNavigate();
  const [kind, setKind] = useState('drugs');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm('drugs'));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const config = configs[kind];
  const rows = kind === 'references' ? dataset.references : dataset[kind];
  const filteredRows = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const openNew = () => { setEditing(null); setForm(blankForm(kind)); setSelectedRefs([]); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ ...blankForm(kind), ...row }); setSelectedRefs(kind === 'interactions' ? dataset.interactionReferences.filter((link) => link.interaction_id === row.id).map((link) => link.reference_id) : []); setModalOpen(true); };
  const changeKind = (next) => { setKind(next); setQuery(''); setEditing(null); setForm(blankForm(next)); setSelectedRefs([]); setModalOpen(false); };
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const notify = (message, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 5000); };

  const submit = async (event) => {
    event.preventDefault();
    if (kind === 'interactions' && (!form.gene_id || !form.drug_id)) { notify('Select both a gene and a drug before saving.', 'error'); return; }
    setSaving(true);
    try {
      const payload = {};
      config.fields.forEach(([key]) => { payload[key] = form[key] === '' ? null : form[key]; });
      if (kind === 'interactions') { payload.gene_id = form.gene_id; payload.drug_id = form.drug_id; }
      const saved = await saveRecord(config.table, payload, editing?.id);
      if (kind === 'interactions') await replaceInteractionReferences(saved.id, selectedRefs);
      await refresh(); setEditing(null); setForm(blankForm(kind)); setSelectedRefs([]); setModalOpen(false); notify(`${kind.slice(0, -1)} ${editing ? 'updated' : 'created'} successfully.`);
    } catch (err) { notify(err.message || 'The database rejected this write. Check RLS and required fields.', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (row) => {
    const name = row.name || row.symbol || row.title || 'this record';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      if (kind === 'interactions') await supabase.from('interaction_references').delete().eq('interaction_id', row.id);
      await deleteRecord(config.table, row.id); await refresh(); notify('Record deleted.');
    } catch (err) { notify(err.message || 'The database rejected this deletion. Check RLS and related records.', 'error'); }
  };

  const logout = async () => { await supabase?.auth.signOut(); navigate('/admin/login', { replace: true }); };
  return <div><PageHeader eyebrow="Protected workspace" title="Administration" subtitle="Manage live PharmacoGene records through Supabase. Every write is protected by authentication, admin membership and database policies." action={<button className="btn-secondary" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</button>} /><InfoNote tone="amber"><strong>Use with care.</strong> This panel writes to the shared Supabase database. Do not add clinical claims that are not supported by an appropriate source. If RLS blocks an operation, the error is shown and no bypass is attempted.</InfoNote><div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]"><aside className="surface h-fit p-2"><div className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Manage tables</div>{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => changeKind(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${kind === key ? 'bg-violet-50 text-violet-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}<span className="ml-auto text-xs text-slate-400">{key === 'references' ? dataset.references.length : dataset[key].length}</span></button>)}</aside><section><div className="surface p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><SearchInput value={query} onChange={setQuery} placeholder={`Search ${kind}…`} /><button className="btn-primary shrink-0" onClick={openNew}><Plus className="h-4 w-4" /> Add {kind.slice(0, -1)}</button></div><div className="mt-5">{filteredRows.length ? <TableFrame><table className="w-full min-w-[680px] border-collapse"><thead><tr>{config.columns.map((column) => <th key={column} className="table-head">{column.replaceAll('_', ' ')}</th>)}<th className="table-head">Actions</th></tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id} className="hover:bg-slate-50">{config.columns.map((column) => <td key={column} className="table-cell">{column === 'validation_status' || column === 'review_status' ? <Badge tone="slate">{row[column] || 'Not provided'}</Badge> : column === 'gene_id' ? <span className="font-semibold">{dataset.genes.find((gene) => gene.id === row[column])?.symbol || 'Not provided'}</span> : column === 'drug_id' ? <span className="font-semibold">{dataset.drugs.find((drug) => drug.id === row[column])?.name || 'Not provided'}</span> : <span className="line-clamp-2">{row[column] || 'Not provided'}</span>}</td>)}<td className="table-cell"><div className="flex items-center gap-1"><button className="btn-ghost !px-2" onClick={() => openEdit(row)} aria-label="Edit"><Edit3 className="h-4 w-4" /></button><button className="btn-ghost !px-2 !text-rose-500 hover:!bg-rose-50" onClick={() => remove(row)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></TableFrame> : <EmptyState title={`No ${kind} records`} message="Create a record or adjust your search. The table reflects the live database response." />}</div></div></section></div>{modalOpen && <Modal title={`${editing ? 'Edit' : 'Add'} ${kind.slice(0, -1)}`} onClose={() => { setEditing(null); setForm(blankForm(kind)); setModalOpen(false); }}><form onSubmit={submit} className="space-y-4">{kind === 'interactions' && <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="label">Gene <span className="text-rose-500">*</span></span><select className="input" value={form?.gene_id || ''} onChange={(event) => setValue('gene_id', event.target.value)} required><option value="">Select gene</option>{dataset.genes.map((gene) => <option key={gene.id} value={gene.id}>{gene.symbol} · {gene.full_name}</option>)}</select></label><label className="block"><span className="label">Drug <span className="text-rose-500">*</span></span><select className="input" value={form?.drug_id || ''} onChange={(event) => setValue('drug_id', event.target.value)} required><option value="">Select drug</option>{dataset.drugs.map((drug) => <option key={drug.id} value={drug.id}>{drug.name}</option>)}</select></label></div>}{config.fields.map(([key, label, required]) => <Field key={key} label={label} value={form?.[key]} onChange={(value) => setValue(key, value)} required={required} type={key.endsWith('url') || key === 'url' ? 'url' : 'text'} multiline={['clinical_implication', 'phenotype', 'allele_or_genotype'].includes(key)} />)}{kind === 'interactions' && <div><div className="label">Link references</div><div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">{dataset.references.map((reference) => <label key={reference.id} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={selectedRefs.includes(reference.id)} onChange={(event) => setSelectedRefs((current) => event.target.checked ? [...current, reference.id] : current.filter((id) => id !== reference.id))} /><span><span className="font-semibold text-slate-700">{reference.title}</span><span className="block text-xs text-slate-400">{reference.source_organization}</span></span></label>)}</div></div>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(blankForm(kind)); setModalOpen(false); }}><X className="h-4 w-4" /> Cancel</button><button className="btn-primary" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save record'}</button></div></form></Modal>}<Toast toast={toast} onDismiss={() => setToast(null)} /></div>;
}
