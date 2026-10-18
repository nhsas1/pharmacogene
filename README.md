# PharmacoGene

PharmacoGene is a responsive pharmacogenomics research workspace backed by the existing Supabase project `lzexxzgmtjsenjubarme`. It provides live browsing for genes, drugs, drug–gene associations and scientific references, plus a protected admin interface for authorized database maintenance.

## Stack

- React + Vite
- React Router
- Tailwind CSS
- Supabase JavaScript client
- Lucide React icons

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill .env.local with the Supabase URL and publishable key
npm run dev
```

The app never uses a service-role key. The browser only receives the Supabase URL and publishable key.

## Existing database schema observed

The app was adapted to the live public schema without creating or modifying any database object.

| Table | Observed columns |
| --- | --- |
| `genes` | `id`, `symbol`, `full_name`, `chromosome`, `source_name`, `source_url`, `validation_status` |
| `drugs` | `id`, `name`, `drug_class`, `source_name`, `source_url`, `validation_status` |
| `scientific_references` | `id`, `gene_symbol`, `title`, `source_organization`, `url`, `validation_status` |
| `drug_gene_interactions` | `id`, `gene_id`, `drug_id`, `association_type`, `clinical_implication`, `phenotype`, `allele_or_genotype`, `evidence_level`, `review_status`, `source_url` |
| `interaction_references` | `interaction_id`, `reference_id` |
| `admin_users` | Present; no rows were exposed to the publishable-key read check |

At inspection time the public API returned 10 genes, 10 drugs, 14 interactions and 14 interaction-reference rows. The app therefore shows unavailable description, PMID, DOI, genotype and clinical fields as **Not provided** rather than inventing values.

## Features

- Live dashboard counts and association chart calculated from Supabase records.
- Universal search across genes, drugs and reference titles.
- Searchable and sortable drug and gene explorers with detail pages.
- Drug–gene interaction table with gene/drug filters, null-safe clinical fields and reference links.
- Scientific reference library with source links and citation maps.
- Supabase Authentication login for `/admin/login` with no public registration.
- Admin membership verification against `admin_users`; authenticated users without membership are denied.
- Admin CRUD forms for drugs, genes, interactions and references, including interaction-to-reference linking.
- User-facing educational/research-use disclaimer; no prescribing recommendations.
- Explicit loading, empty and connection-error states.

## Admin setup

1. Create or use an account in Supabase Authentication.
2. Add that account to the existing `admin_users` table using the table's real authorization columns and your reviewed RLS policy. Do this manually in the Supabase dashboard or a reviewed migration; this repository does not change RLS.
3. Confirm that the `admin_users` membership check is readable for the authenticated admin and that INSERT, UPDATE and DELETE policies exist for the managed tables.
4. Sign in at `/admin/login`. A successful Authentication login is not sufficient without an `admin_users` membership row.

The current sandbox could inspect public data through the publishable REST API but could not retrieve server-side RLS policy metadata because the Supabase schema addon was unavailable. No policies were changed or disabled. Review them manually before enabling writes.

## Verification notes

- `npm run build` is the primary compile check.
- Live read checks use the configured Supabase REST endpoint and are represented in the dashboard; failed connections render an error instead of zero counts.
- Admin CRUD is implemented but should only be exercised with a provisioned test admin because the database is shared with production data. The app reports policy or validation errors from Supabase and does not claim a write passed unless Supabase returns success.
