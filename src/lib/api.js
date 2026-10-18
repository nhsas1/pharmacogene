import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const TABLES = ['genes', 'drugs', 'scientific_references', 'drug_gene_interactions', 'interaction_references'];

export const emptyDataset = {
  genes: [],
  drugs: [],
  references: [],
  interactions: [],
  interactionReferences: []
};

export async function loadDataset() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  }
  const queries = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`${table}: ${error.message}`);
      return [table, data ?? []];
    })
  );
  const result = Object.fromEntries(queries);
  return {
    genes: result.genes,
    drugs: result.drugs,
    references: result.scientific_references,
    interactions: result.drug_gene_interactions,
    interactionReferences: result.interaction_references
  };
}

export async function checkAdminMembership(user) {
  if (!supabase || !user) return { allowed: false, reason: 'No authenticated user.' };
  const probes = [
    { column: 'user_id', value: user.id },
    { column: 'email', value: user.email },
    { column: 'id', value: user.id }
  ];
  let lastError = null;
  for (const probe of probes) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq(probe.column, probe.value)
      .limit(1);
    if (!error && data?.length) return { allowed: true, record: data[0] };
    if (error) lastError = error;
  }
  return {
    allowed: false,
    reason: lastError?.message || 'Your account is not listed in admin_users.'
  };
}

export async function saveRecord(table, values, id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const query = id
    ? supabase.from(table).update(values).eq('id', id).select().single()
    : supabase.from(table).insert(values).select().single();
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRecord(table, id) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function replaceInteractionReferences(interactionId, referenceIds) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error: deleteError } = await supabase.from('interaction_references').delete().eq('interaction_id', interactionId);
  if (deleteError) throw new Error(deleteError.message);
  if (!referenceIds?.length) return;
  const rows = referenceIds.map((reference_id) => ({ interaction_id: interactionId, reference_id }));
  const { error: insertError } = await supabase.from('interaction_references').insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export function byId(rows, id) {
  return rows.find((row) => row.id === id);
}

export function interactionReferences(dataset, interactionId) {
  const ids = dataset.interactionReferences
    .filter((link) => link.interaction_id === interactionId)
    .map((link) => link.reference_id);
  return dataset.references.filter((reference) => ids.includes(reference.id));
}

export function interactionsForDrug(dataset, drugId) {
  return dataset.interactions.filter((row) => row.drug_id === drugId);
}

export function interactionsForGene(dataset, geneId) {
  return dataset.interactions.filter((row) => row.gene_id === geneId);
}

export function hasTimestamps(row) {
  return Boolean(row?.created_at || row?.updated_at || row?.published_at);
}

export function readableField(value, fallback = 'Not provided') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

export function displayDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
