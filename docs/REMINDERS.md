# Restoring email reminders

The current app sends `{ transactionId }` to `send-reminder`. The original
function expected `{ toEmail, toName, message }`. Deploy the current function
along with its shared module when updating the app; an old function cannot handle
the new request.

1. Run `supabase/migrations/20261006000006_outbound_quotas.sql` in the project's
   Supabase SQL Editor if it has not already been applied.
2. In Supabase Edge Function secrets, set `BREVO_API_KEY` to a Brevo API key
   (not an SMTP password) and `BREVO_SENDER_EMAIL` to your verified Brevo sender.
   Also set `APP_URL` to the public HTTPS address of your app, for example
   `https://your-app.example.com`. With this secret set, emails include an
   "Open transaction in Hisab Kitab" link. The link opens the sender's friend
   thread from the recipient's account, loads and highlights the transaction
   even when it is older than the first history page, and resumes after login.
   Without `APP_URL`, reminders still send but omit the link.
3. From this repository, deploy the updated function to the same project used by
   the app. The CLI bundles `supabase/functions/_shared/auth.ts` automatically:

   ```powershell
   npx supabase login
   npx supabase functions deploy send-reminder --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with the project ID in Supabase project settings.
   Keep JWT verification enabled; the function also verifies the user through
   Supabase Auth and checks their transaction permissions.
4. Reload the updated app, sign in, and press Remind. The app now displays the
   function's error message and disables the button while sending. If a request
   fails, inspect Edge Functions > send-reminder > Logs in Supabase.

Reminders are available for a transaction awaiting your friend's acceptance or
for your payment claim awaiting confirmation. The recipient and email content
are derived from the database. Up to ten attempts per user per hour are allowed;
provider failures also consume an attempt. A successful response means Brevo
accepted the email; check Brevo's transactional email logs for delivery or bounce
status if it does not arrive.

Common errors point to missing secrets, the missing quota migration, an expired
session, an undeployed function, or a rejected Brevo sender/API key. A generic
error from an older deployed function can also mean the payload versions differ.
