import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Dna, FlaskConical, Network, Search, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDataset } from '../App';
import { displayDate, hasTimestamps, readableField } from '../lib/api';
import { Badge, InfoNote, PageHeader, SearchInput, StatCard, TableFrame } from '../components/Primitives';

function labelFor(row, type) {
  if (type === 'gene') return `${row.symbol} · ${row.full_name}`;
  if (type === 'drug') return `${row.name} · ${row.drug_class || 'Unclassified'}`;
  return row.title;
}

export default function Dashboard() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const result = [];
    dataset.genes.filter((row) => `${row.symbol} ${row.full_name}`.toLowerCase().includes(q)).slice(0, 3).forEach((row) => result.push({ type: 'gene', row }));
    dataset.drugs.filter((row) => `${row.name} ${row.drug_class || ''}`.toLowerCase().includes(q)).slice(0, 3).forEach((row) => result.push({ type: 'drug', row }));
    dataset.references.filter((row) => `${row.title} ${row.source_organization || ''} ${row.gene_symbol || ''}`.toLowerCase().includes(q)).slice(0, 3).forEach((row) => result.push({ type: 'reference', row }));
    return result.slice(0, 7);
  }, [dataset, query]);

  const geneCounts = dataset.genes.map((gene) => ({ ...gene, count: dataset.interactions.filter((interaction) => interaction.gene_id === gene.id).length })).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...geneCounts.map((item) => item.count), 1);
  const timestamped = [...dataset.genes, ...dataset.drugs, ...dataset.references, ...dataset.interactions].filter(hasTimestamps).sort((a, b) => new Date(b.created_at || b.updated_at || b.published_at) - new Date(a.created_at || a.updated_at || a.published_at)).slice(0, 5);

  return <div>
    <PageHeader eyebrow="Pharmacogenomics knowledgebase" title="Evidence, organized for discovery." subtitle="A live research workspace for exploring curated gene, drug, interaction and reference records from the PharmacoGene database." action={<div className="flex items-center gap-2"><Badge tone="teal">Live Supabase data</Badge><span className="hidden text-xs font-semibold text-slate-400 sm:inline">Read-only research view</span></div>} />
    <div className="surface relative overflow-visible bg-[#0c2347] p-5 text-white shadow-lift sm:p-7"><div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden opacity-30"><div className="absolute -right-16 -top-28 h-72 w-72 rounded-full border border-teal-300/50" /><div className="absolute -right-2 -top-14 h-52 w-52 rounded-full border border-violet-300/50" /><div className="absolute right-20 top-8 h-32 w-32 rounded-full border border-white/30" /></div><div className="relative max-w-3xl"><div className="eyebrow text-teal-300">Universal search</div><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">Start with a gene, drug, or evidence title.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Search the live dataset to jump directly into the most relevant record.</p><div className="relative mt-5 max-w-2xl"><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-2xl border border-white/15 bg-white px-12 py-4 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" placeholder="e.g. CYP2C19, clopidogrel, CPIC…" /></div>{query && <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-lift">{matches.length ? matches.map(({ type, row }) => <button key={`${type}-${row.id}`} onClick={() => navigate(type === 'gene' ? `/genes/${row.id}` : type === 'drug' ? `/drugs/${row.id}` : `/references/${row.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-50"><span className={`grid h-8 w-8 place-items-center rounded-lg ${type === 'gene' ? 'bg-violet-50 text-violet-700' : type === 'drug' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>{type === 'gene' ? <Dna className="h-4 w-4" /> : type === 'drug' ? <FlaskConical className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{labelFor(row, type)}</span><span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{type}</span></span><ArrowRight className="h-4 w-4 text-slate-300" /></button>) : <div className="p-4 text-sm text-slate-500">No records match “{query}”.</div>}</div>}</div></div></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Genes" value={dataset.genes.length} detail="Curated gene records" icon={Dna} accent="purple" /><StatCard label="Drugs" value={dataset.drugs.length} detail="Indexed compound records" icon={FlaskConical} accent="teal" /><StatCard label="Interactions" value={dataset.interactions.length} detail="Gene–drug associations" icon={Network} accent="blue" /><StatCard label="References" value={dataset.references.length} detail="Evidence library entries" icon={BookOpen} accent="amber" /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="surface p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="eyebrow">Association landscape</div><h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950">Drug–gene associations by gene</h2><p className="mt-1 text-xs leading-5 text-slate-500">Counts are calculated from the live interaction table.</p></div><Link to="/interactions" className="btn-ghost">Explore <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-7 flex h-52 items-end gap-2 border-b border-l border-slate-200 px-3 pb-0 pt-5 sm:gap-4">{geneCounts.map((gene) => <Link to={`/genes/${gene.id}`} key={gene.id} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="chart-bar w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#6f4abd] to-[#a78bfa]" style={{ height: `${Math.max((gene.count / maxCount) * 100, gene.count ? 12 : 3)}%` }} title={`${gene.symbol}: ${gene.count}`} /><span className="max-w-16 truncate text-[10px] font-bold text-slate-500 group-hover:text-violet-700">{gene.symbol}</span></Link>)}</div></section>
      <section className="surface p-5 sm:p-6"><div className="eyebrow">Data freshness</div><h2 className="mt-2 text-xl font-bold tracking-[-0.03em] text-slate-950">Recently added records</h2>{timestamped.length ? <div className="mt-4 space-y-1">{timestamped.map((row, index) => <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0" key={`${row.id}-${index}`}><div className="min-w-0"><div className="truncate text-sm font-bold text-slate-800">{readableField(row.title || row.name || row.symbol || row.association_type)}</div><div className="mt-1 text-xs text-slate-400">{displayDate(row.created_at || row.updated_at || row.published_at)}</div></div><Badge tone="slate">record</Badge></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-sm leading-6 text-slate-500">Timestamp fields are not present in the current schema, so recency cannot be inferred without inventing metadata.</div>}</section>
    </div>
    <InfoNote tone="amber"><strong>Research-use notice.</strong> PharmacoGene presents database-backed evidence and associations for scientific exploration. It is not medical advice and does not make prescribing recommendations. Clinical interpretation requires appropriate professional review and source verification.</InfoNote>
    <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400"><ShieldAlert className="h-4 w-4" /> Public browsing is read-only; administrative writes require Supabase Authentication, admin membership and database RLS.</div>
  </div>;
}
