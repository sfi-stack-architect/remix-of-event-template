import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  MousePointerClick, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: "primary" | "nominal" | "warning" | "critical";
}

export function KPIGrid() {
  const { data: kpiData, isLoading } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Get session counts
      const [todaySessions, yesterdaySessions, todayEvents, yesterdayEvents] = await Promise.all([
        supabase
          .from("analytics_sessions" as never)
          .select("*", { count: "exact", head: true })
          .gte("started_at", oneDayAgo.toISOString()),
        supabase
          .from("analytics_sessions" as never)
          .select("*", { count: "exact", head: true })
          .gte("started_at", twoDaysAgo.toISOString())
          .lt("started_at", oneDayAgo.toISOString()),
        supabase
          .from("analytics_events" as never)
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneDayAgo.toISOString()),
        supabase
          .from("analytics_events" as never)
          .select("*", { count: "exact", head: true })
          .gte("created_at", twoDaysAgo.toISOString())
          .lt("created_at", oneDayAgo.toISOString()),
      ]);

      const todaySessionCount = todaySessions.count || 0;
      const yesterdaySessionCount = yesterdaySessions.count || 1;
      const sessionChange = ((todaySessionCount - yesterdaySessionCount) / yesterdaySessionCount) * 100;

      const todayEventCount = todayEvents.count || 0;
      const yesterdayEventCount = yesterdayEvents.count || 1;
      const eventChange = ((todayEventCount - yesterdayEventCount) / yesterdayEventCount) * 100;

      return {
        sessions: { value: todaySessionCount, change: sessionChange },
        events: { value: todayEventCount, change: eventChange },
        avgDuration: { value: "4m 32s", change: 12.5 },
        conversionRate: { value: "3.2%", change: -2.1 },
      };
    },
    refetchInterval: 30000,
  });

  const kpis: KPIData[] = [
    {
      label: "Active Sessions",
      value: kpiData?.sessions.value || 0,
      change: kpiData?.sessions.change || 0,
      changeLabel: "vs yesterday",
      icon: <Users className="h-5 w-5" />,
      color: "primary",
    },
    {
      label: "Total Events",
      value: kpiData?.events.value || 0,
      change: kpiData?.events.change || 0,
      changeLabel: "vs yesterday",
      icon: <MousePointerClick className="h-5 w-5" />,
      color: "nominal",
    },
    {
      label: "Avg. Session Duration",
      value: kpiData?.avgDuration.value || "0m",
      change: kpiData?.avgDuration.change || 0,
      changeLabel: "vs last week",
      icon: <Clock className="h-5 w-5" />,
      color: "warning",
    },
    {
      label: "Conversion Rate",
      value: kpiData?.conversionRate.value || "0%",
      change: kpiData?.conversionRate.change || 0,
      changeLabel: "vs last month",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "critical",
    },
  ];

  const colorClasses = {
    primary: {
      bg: "bg-primary/10",
      border: "border-primary/20",
      text: "text-primary",
      glow: "glow-primary",
    },
    nominal: {
      bg: "bg-signal-nominal/10",
      border: "border-signal-nominal/20",
      text: "text-signal-nominal",
      glow: "glow-nominal",
    },
    warning: {
      bg: "bg-signal-warning/10",
      border: "border-signal-warning/20",
      text: "text-signal-warning",
      glow: "glow-warning",
    },
    critical: {
      bg: "bg-signal-critical/10",
      border: "border-signal-critical/20",
      text: "text-signal-critical",
      glow: "glow-critical",
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="widget-container p-4 animate-pulse">
            <div className="h-4 bg-secondary rounded w-1/2 mb-3" />
            <div className="h-8 bg-secondary rounded w-2/3 mb-2" />
            <div className="h-3 bg-secondary rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.label}
          className={cn(
            "widget-container enterprise-card p-4",
            "animate-fade-in-up"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center",
                colorClasses[kpi.color].bg,
                colorClasses[kpi.color].border,
                "border"
              )}
            >
              <span className={colorClasses[kpi.color].text}>{kpi.icon}</span>
            </div>
            <ChangeIndicator change={kpi.change} />
          </div>

          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            {kpi.label}
          </p>
          <p className="font-mono text-2xl font-semibold text-foreground">
            {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            {kpi.changeLabel}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 0.1) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="font-mono text-[10px]">0%</span>
      </div>
    );
  }

  const isPositive = change > 0;
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-full",
        isPositive
          ? "bg-signal-nominal/10 text-signal-nominal"
          : "bg-signal-critical/10 text-signal-critical"
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span className="font-mono text-[10px]">
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </span>
    </div>
  );
}
