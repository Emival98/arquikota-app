create table if not exists public.arquikota_resolutions (
  project_id text not null,
  alert_id text not null,
  title text not null,
  category text not null check (
    category in ('runtime', 'dependency', 'platform', 'practice', 'automation')
  ),
  note text not null default '',
  resolved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (project_id, alert_id)
);

comment on table public.arquikota_resolutions is
  'Histórico de alertas resolvidos do ArquiKota. Escrita exclusiva do servidor (service role).';

create index if not exists arquikota_resolutions_project_idx
  on public.arquikota_resolutions (project_id, resolved_at desc);

alter table public.arquikota_resolutions enable row level security;
