import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, FlaskConical, GitBranch, Layers3, Link2, Search, Tag, UsersRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDataset } from '../App';
import { byId, interactionsForDrug, interactionsForGene, interactionReferences, readableField } from '../lib/api';
import { Badge, EmptyState, InfoNote, PageHeader, SearchInput, TableFrame } from '../components/Primitives';

function sortRows(rows, sortKey, direction) {
  return [...rows].sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? '')) * direction);
}

function ExplorerTable({ type, rows, query }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState(type === 'drug' ? 'name' : 'symbol');
  const [direction, setDirection] = useState(1);
  const filtered = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const sorted = sortRows(filtered, sortKey, direction);
  const setSort = (key) => { if (sortKey === key) setDirection((value) => value * -1); else { setSortKey(key); setDirection(1); } };
  const SortButton = ({ label, field }) => <button className="inline-flex items-center gap-1" onClick={() => setSort(field)}>{label}<span className="text-slate-300">{sortKey === field ? direction === 1 ? '↑' : '↓' : '↕'}</span></button>;
  if (!sorted.length) return <EmptyState title={`No ${type} records found`} message="Try a different search term. Results are read directly from Supabase." />;
  return <TableFrame><table className="data-table w-full border-collapse"><thead><tr><th className="table-head">{type === 'drug' ? <SortButton label="Drug name" field="name" /> : <SortButton label="Symbol" field="symbol" />}</th><th className="table-head">{type === 'drug' ? <SortButton label="Class" field="drug_class" /> : <SortButton label="Full name" field="full_name" />}</th><th className="table-head">{type === 'drug' ? 'Source' : <SortButton label="Chromosome" field="chromosome" />}</th><th className="table-head">Status</th><th className="table-head" /></tr></thead><tbody>{sorted.map((row) => <tr key={row.id} className="group hover:bg-slate-50"><td className="table-cell"><button onClick={() => navigate(`/${type === 'drug' ? 'drugs' : 'genes'}/${row.id}`)} className="text-left font-bold text-slate-900 group-hover:text-violet-700">{readableField(type === 'drug' ? row.name : row.symbol)}</button>{type === 'gene' && <div className="mt-1 text-xs text-slate-400">{readableField(row.full_name)}</div>}</td><td className="table-cell">{type === 'drug' ? readableField(row.drug_class) : readableField(row.full_name)}</td><td className="table-cell">{type === 'drug' ? (row.source_url ? <a href={row.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-700 hover:underline">{readableField(row.source_name, 'Source')}<ExternalLink className="h-3 w-3" /></a> : readableField(row.source_name)) : readableField(row.chromosome)}</td><td className="table-cell"><Badge tone={row.validation_status?.includes('curated') ? 'teal' : 'slate'}>{readableField(row.validation_status, 'Unspecified')}</Badge></td><td className="table-cell text-right"><Link to={`/${type === 'drug' ? 'drugs' : 'genes'}/${row.id}`} className="btn-ghost !px-2"><ArrowRight className="h-4 w-4" /></Link></td></tr>)}</tbody></table></TableFrame>;
}

export function DrugsPage() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');
  return <div><PageHeader eyebrow="Compound index" title="Drug Explorer" subtitle="Search and sort the live drug catalogue, then open a record to inspect its associated genes, interactions and evidence." action={<Badge tone="teal">{dataset.drugs.length} records</Badge>} /><div className="mb-5 max-w-xl"><SearchInput value={query} onChange={setQuery} placeholder="Search by drug name, class or source…" /></div><ExplorerTable type="drug" rows={dataset.drugs} query={query} /></div>;
}

export function GenesPage() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');
  return <div><PageHeader eyebrow="Genomic index" title="Gene Explorer" subtitle="Explore the genes currently represented in PharmacoGene, including their source metadata and linked drug associations." action={<Badge tone="purple">{dataset.genes.length} records</Badge>} /><div className="mb-5 max-w-xl"><SearchInput value={query} onChange={setQuery} placeholder="Search by symbol, full name or chromosome…" /></div><ExplorerTable type="gene" rows={dataset.genes} query={query} /></div>;
}

function DetailHeader({ eyebrow, title, subtitle, backTo }) {
  return <><Link to={backTo} className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 hover:text-slate-700"><ArrowLeft className="h-4 w-4" /> Back to explorer</Link><PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} /></>;
}

function InteractionRows({ dataset, rows }) {
  if (!rows.length) return <EmptyState title="No linked interactions" message="This record has no relationship rows in drug_gene_interactions." />;
  return <div className="space-y-3">{rows.map((interaction) => { const drug = byId(dataset.drugs, interaction.drug_id); const gene = byId(dataset.genes, interaction.gene_id); return <Link to={`/interactions/${interaction.id}`} key={interaction.id} className="block rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/30"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge tone="purple">{readableField(gene?.symbol)}</Badge><span className="text-slate-300">×</span><Badge tone="teal">{readableField(drug?.name)}</Badge></div><div className="mt-3 text-sm font-bold text-slate-800">{readableField(interaction.association_type)}</div></div><ArrowRight className="h-4 w-4 text-slate-300" /></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>Evidence: {readableField(interaction.evidence_level, 'Not provided')}</span><span>•</span><span>{readableField(interaction.review_status, 'Review status unavailable')}</span></div></Link>; })}</div>;
}

export function DrugDetail() {
  const { id } = useParams();
  const { dataset } = useDataset();
  const drug = byId(dataset.drugs, id);
  if (!drug) return <EmptyState title="Drug not found" message="The requested record is not available in the current database response." />;
  const interactions = interactionsForDrug(dataset, id);
  const references = [...new Map(interactions.flatMap((row) => interactionReferences(dataset, row.id)).map((ref) => [ref.id, ref])).values()];
  return <div>
    <DetailHeader backTo="/drugs" eyebrow="Drug record" title={readableField(drug.name)} subtitle="A database-backed view of compound metadata and linked pharmacogenomic associations." />
    <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <section className="surface p-5 sm:p-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><FlaskConical className="h-6 w-6" /></div>
        <h2 className="mt-5 text-xl font-bold text-slate-950">Drug information</h2>
        <dl className="mt-5 space-y-4">{[['Drug class', drug.drug_class], ['Validation', drug.validation_status], ['Source', drug.source_name]].map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-3"><dt className="label">{label}</dt><dd className="text-sm font-semibold text-slate-700">{readableField(value)}</dd></div>)}</dl>
        {drug.source_url && <a href={drug.source_url} target="_blank" rel="noreferrer" className="btn-secondary mt-5 w-full">Open source record <ExternalLink className="h-4 w-4" /></a>}
      </section>
      <div className="space-y-6">
        <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><div className="eyebrow">Linked evidence</div><h2 className="mt-2 text-xl font-bold text-slate-950">Associated interactions <span className="text-slate-400">{interactions.length}</span></h2></div><GitBranch className="h-5 w-5 text-violet-500" /></div><div className="mt-5"><InteractionRows dataset={dataset} rows={interactions} /></div></section>
        <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><div className="eyebrow">Evidence library</div><h2 className="mt-2 text-xl font-bold text-slate-950">Linked references <span className="text-slate-400">{references.length}</span></h2></div><Link2 className="h-5 w-5 text-teal-500" /></div>{references.length ? <div className="mt-5 space-y-3">{references.map((ref) => <Link to={`/references/${ref.id}`} key={ref.id} className="block rounded-xl border border-slate-200 p-4 hover:border-teal-300"><div className="text-sm font-bold text-slate-800">{readableField(ref.title)}</div><div className="mt-1 text-xs text-slate-500">{readableField(ref.source_organization)} · {readableField(ref.gene_symbol, 'Gene not specified')}</div></Link>)}</div> : <EmptyState title="No references linked" />}</section>
      </div>
    </div>
  </div>;
}

export function GeneDetail() {
  const { id } = useParams();
  const { dataset } = useDataset();
  const gene = byId(dataset.genes, id);
  if (!gene) return <EmptyState title="Gene not found" message="The requested record is not available in the current database response." />;
  const interactions = interactionsForGene(dataset, id);
  return <div><DetailHeader backTo="/genes" eyebrow="Gene record" title={readableField(gene.symbol)} subtitle={readableField(gene.full_name, 'Full gene name not provided in the current schema.')} /><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><section className="surface p-5 sm:p-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><DnaIcon /></div><h2 className="mt-5 text-xl font-bold text-slate-950">Gene profile</h2><dl className="mt-5 space-y-4">{[['Full name', gene.full_name], ['Chromosome', gene.chromosome], ['Validation', gene.validation_status], ['Source', gene.source_name]].map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-3"><dt className="label">{label}</dt><dd className="text-sm font-semibold text-slate-700">{readableField(value)}</dd></div>)}</dl>{gene.source_url && <a href={gene.source_url} target="_blank" rel="noreferrer" className="btn-secondary mt-5 w-full">Open source record <ExternalLink className="h-4 w-4" /></a>}</section><section className="surface p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><div className="eyebrow">Drug associations</div><h2 className="mt-2 text-xl font-bold text-slate-950">Linked interactions <span className="text-slate-400">{interactions.length}</span></h2></div><UsersRound className="h-5 w-5 text-violet-500" /></div><div className="mt-5"><InteractionRows dataset={dataset} rows={interactions} /></div></section></div></div>;
}

function DnaIcon() { return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3c0 4 10 4 10 9s-10 5-10 9M17 3c0 4-10 4-10 9s10 5 10 9M7.5 6.5h9M7.5 17.5h9M6.5 12h11" strokeLinecap="round" /></svg>; }
