# Natural-language transaction drafts

Add Transaction now has an optional **Describe a transaction** panel. A signed-in
user can describe a friend expense or loan in English, Hindi, or Hinglish. The
server extracts a draft; the user checks the suggested details and selected
friends, then presses **Use draft in form**. This only fills the existing form.
The existing **Save** action, validation, acceptance rules, and financial RPCs
remain responsible for creating a transaction.

## Deploy

1. Apply `supabase/migrations/20261007000000_transaction_draft_quota.sql` after the
   existing migrations. This adds a separate quota channel without modifying
   ledger tables or changing existing quota behavior.
2. Ensure the Edge Function has the existing `GROQ_API_KEY` secret used by receipt
   reading. Optionally set `TRANSACTION_AI_MODEL` to a supported Groq chat model
   with JSON Object Mode and `reasoning_effort: none`. The default is
   `qwen/qwen3.8-27b`. Provider model availability should be checked when deploying.
3. Deploy `parse-transaction` with its shared modules:

   ```powershell
   npx supabase functions deploy parse-transaction --project-ref YOUR_PROJECT_REF
   ```

   Keep JWT verification enabled. The function also validates the caller token.
4. Deploy the frontend after the migration and function. Without the function,
   manual entry remains available and the AI panel shows an error on request.

## Limits and behavior

- Maximum description: 1,000 characters; request body: 8KB; up to 20 attempts per
  user per UTC hour. Provider failures consume quota. Provider timeout: 25 seconds.
- Only the sentence is sent to Groq. The friend list, IDs, balances, and database
  credentials are never part of the model prompt. Descriptions are not persisted
  by this feature or logged in Edge Function errors. Provider retention follows
  the provider's own settings and terms.
- Model output is validated on the server and client. Amounts must be positive
  decimal INR strings with at most two decimals. Financial calculations remain
  in the existing application/database logic.
- Friend matching uses a unique exact name or a unique whole-name prefix.
  Ambiguous or unmatched names require manual selection in the review panel.
- Supported: one friend, equal split including the user and paid by the user,
  and the same stated amount owed separately by each friend.
- Unsupported: repayment/settlement, unequal splits, non-INR currencies, historical
  dates, and shared expenses paid by another friend. The model is instructed to
  request clarification, rather than force them into a supported transaction.
  Model interpretation is fallible: users must still review every field.
- No AI-generated draft can automatically save, accept a request, or confirm a
  payment. **Use draft in form** replaces the current editable form values.

## Validation

Run `node --test tests/transactionDraft.test.ts tests/parseTransaction.test.mjs`,
`npm run build`, and `npm run lint`. The handler tests isolate authentication,
quota, and provider dependencies; they do not make live database or AI requests.
After deployment, test synthetic examples for each supported mode, ambiguous
names, missing amounts, repayment requests, rate limits, and unavailable provider.
Check an actual model response before declaring live AI integration verified.
