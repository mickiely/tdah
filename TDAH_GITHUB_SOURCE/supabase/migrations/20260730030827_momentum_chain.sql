alter table public.user_progress
  add column current_chain_length integer not null default 0,
  add column longest_chain_length integer not null default 0,
  add column chain_last_qualifying_date date null,
  add column last_grace_used_date date null,
  add column comeback_count integer not null default 0;
