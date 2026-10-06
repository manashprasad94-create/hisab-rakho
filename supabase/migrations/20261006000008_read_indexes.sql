create index if not exists group_fund_transactions_fund_created_idx
  on public.group_fund_transactions (fund_id, created_at desc);
create index if not exists personal_expenses_user_spent_idx
  on public.personal_expenses (user_id, spent_on desc);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists friend_transactions_payer_created_idx
  on public.friend_transactions (payer_id, created_at desc);
create index if not exists friend_transactions_payee_created_idx
  on public.friend_transactions (payee_id, created_at desc);
