# Audit fixes and deployment

The app now calls database functions for fund creation, member addition, deposits,
fund expenses, friend transaction creation and review, group splits, bulk
transactions, payment claims, payment confirmation, and friendship changes. These
changes require the SQL migrations in `supabase/migrations` to be applied in filename
order **before** the updated frontend is used. The deposit functions in the first
three migrations are historical overloads; the app calls the newest six-argument
version. Do not delete old functions without checking active clients.

Deploy the three Edge Functions after applying the migrations. `send-notification`,
`send-reminder`, and `ocr-receipt` now require a signed-in user. The quota migration
must be applied first, because all three functions use `claim_outbound_quota`.

The fund and friend permission migrations revoke direct browser writes to ledger
tables. Their database functions check `auth.uid()` and roles before writing. Confirm that
the live table columns and constraints match the functions before running this
migration. The repository still does not contain the original table creation SQL.

Run `supabase/rls_audit.sql` in the live project's SQL Editor and review its
results. Check that exposed tables have RLS and that policies limit rows to the
owner, friend, or fund member as appropriate. In particular, inspect `profiles`,
`friend_transactions`, `payment_records`, `notifications`, and all fund tables.
The client UI is not an authorization boundary.

After deployment, manually check: owner and co-owner deposits and expenses;
insufficient balance; two simultaneous fund expenses; duplicate payment
confirmation; group split cents; bulk transaction failure; reminder recipient;
notification recipient; receipt upload size; and history paging. No live database
or Edge Function deployment was performed as part of these repository changes.
`npm run build` and `npm run lint` check the browser code. The Edge Function
TypeScript was syntax checked, but no live function or SQL validation was possible
without the connected database schema and credentials.

## Remaining checks

- The live RLS policies and table grants are unknown. The migration revokes direct
  writes to the financial and friendship tables, but reads and other tables still
  depend on their existing policies. `supabase/rls_audit.sql` captures the facts
  needed for a precise follow-up migration.
- Notification requests are authenticated, limited to related users, constrained
  to known titles and local links, and rate limited. The client still supplies
  the message text. Move notification creation to event-based server logic if
  messages must be treated as authoritative financial evidence.
- The original table definitions and generated database types are unavailable;
  these migrations must be checked against the live schema before deployment.
- There is no automated test suite in this repository. Build and lint do not
  prove database authorization or concurrent balance correctness.
