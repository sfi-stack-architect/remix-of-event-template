-- Enterprise Analytics Schema Migration

-- 1. Analytics Sessions Table (for privacy-first tracking)
CREATE TABLE public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymized_token TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  entry_path TEXT,
  referrer_type TEXT,
  user_agent_hash TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Analytics Events Table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_path TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Alerts Configuration Table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'equals')),
  threshold NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_channels JSONB DEFAULT '["in_app"]',
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Alert History Table
CREATE TABLE public.alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metric_value NUMERIC NOT NULL,
  resolved_at TIMESTAMPTZ,
  acknowledged_by UUID,
  notes TEXT
);

-- 5. Custom Reports Table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_scheduled BOOLEAN DEFAULT false,
  schedule_cron TEXT,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Dashboard Configurations Table (for customizable widgets)
CREATE TABLE public.dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  layout JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. AI Insights Table
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'recommendation', 'prediction')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Enhanced Audit Log Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_sessions (public read for analytics, service role write)
CREATE POLICY "Anyone can view analytics sessions" ON public.analytics_sessions
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert sessions" ON public.analytics_sessions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for analytics_events (public read, service role write)
CREATE POLICY "Anyone can view analytics events" ON public.analytics_events
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for alerts (user-specific)
CREATE POLICY "Users can view their own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON public.alerts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all alerts" ON public.alerts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for alert_history
CREATE POLICY "Users can view their alert history" ON public.alert_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.alerts WHERE alerts.id = alert_history.alert_id AND alerts.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all alert history" ON public.alert_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.reports
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for dashboard_configs
CREATE POLICY "Users can view their own dashboards" ON public.dashboard_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboards" ON public.dashboard_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" ON public.dashboard_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" ON public.dashboard_configs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_insights (admins only)
CREATE POLICY "Admins can view AI insights" ON public.ai_insights
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update AI insights" ON public.ai_insights
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs (admins only for viewing, system for writing)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_analytics_sessions_started_at ON public.analytics_sessions(started_at DESC);
CREATE INDEX idx_analytics_sessions_token ON public.analytics_sessions(anonymized_token);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at DESC);

-- Create updated_at trigger for relevant tables
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at
  BEFORE UPDATE ON public.dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_history;