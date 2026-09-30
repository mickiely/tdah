alter table public.focus_sessions
  add column paused_at timestamptz null,
  add column total_paused_seconds integer not null default 0,
  add column actual_minutes integer null;

alter table public.focus_sessions
  drop constraint focus_sessions_status_check;

alter table public.focus_sessions
  add constraint focus_sessions_status_check
  check (status = any (array['in_progress'::text, 'paused'::text, 'completed'::text, 'stopped'::text]));
