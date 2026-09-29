-- FitLog schema v32: contact messages can only arrive through the contact endpoint.
--
-- RUN THIS ONLY AFTER the Department of One Vercel project has SUPABASE_SERVICE_ROLE_KEY and
-- TURNSTILE_SECRET_KEY set and has been redeployed. Its api/contact.js then stores messages with the
-- service key after checking Cloudflare Turnstile. Running this earlier stops the contact form
-- and FitLog's feedback form from saving messages (the email copy still arrives).
--
-- Until now anyone holding the public key could insert rows straight into contact_messages,
-- skipping the endpoint's honeypot and bot check. The service key bypasses row-level security,
-- so the endpoint keeps working; everyone else loses the insert.
drop policy if exists "anyone can send a message" on contact_messages;

-- Check: the remaining policies are the owner-only read, update and delete ones.
select policyname, cmd from pg_policies where tablename = 'contact_messages' order by policyname;
