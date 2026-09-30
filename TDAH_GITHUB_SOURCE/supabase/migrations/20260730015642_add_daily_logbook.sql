create table public.daily_logbook (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  win_text text,
  blocker_text text,
  tomorrow_first_move text,
  journal_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_logbook_user_date_unique unique (user_id, local_date)
);

alter table public.daily_logbook enable row level security;

create policy "Users manage own logbook entries"
  on public.daily_logbook
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger set_daily_logbook_updated_at
  before update on public.daily_logbook
  for each row execute function public.set_updated_at();
