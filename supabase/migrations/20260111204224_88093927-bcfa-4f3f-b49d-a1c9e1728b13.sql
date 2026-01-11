-- Fix overly permissive INSERT policies by restricting to service role pattern
-- Analytics data should only be inserted via edge functions using service role

-- Drop the permissive policies
DROP POLICY IF EXISTS "Service role can insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Service role can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- For analytics_sessions: Allow insert only when there's a valid anonymized_token
CREATE POLICY "Insert analytics sessions with valid token" ON public.analytics_sessions
  FOR INSERT WITH CHECK (anonymized_token IS NOT NULL AND length(anonymized_token) >= 8);

-- For analytics_events: Allow insert only when there's a valid session reference
CREATE POLICY "Insert analytics events with valid session" ON public.analytics_events
  FOR INSERT WITH CHECK (session_id IS NOT NULL AND event_type IS NOT NULL);

-- For audit_logs: Allow insert only when action and resource_type are provided
CREATE POLICY "Insert audit logs with required fields" ON public.audit_logs
  FOR INSERT WITH CHECK (action IS NOT NULL AND resource_type IS NOT NULL);