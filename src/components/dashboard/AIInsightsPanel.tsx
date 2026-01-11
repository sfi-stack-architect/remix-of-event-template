import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity,
  Check,
  X,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  severity: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

const insightIcons: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="h-4 w-4" />,
  anomaly: <AlertTriangle className="h-4 w-4" />,
  recommendation: <Lightbulb className="h-4 w-4" />,
  prediction: <Activity className="h-4 w-4" />,
};

const severityColors: Record<string, string> = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-signal-warning/10 text-signal-warning border-signal-warning/20",
  critical: "bg-signal-critical/10 text-signal-critical border-signal-critical/20",
};

export function AIInsightsPanel({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_insights" as never)
        .select("*")
        .eq("is_dismissed", false)
        .order("created_at", { ascending: false })
        .limit(compact ? 5 : 20);

      if (error) throw error;
      return (data || []) as AIInsight[];
    },
    refetchInterval: 30000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_insights" as never)
        .update({ is_read: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_insights" as never)
        .update({ is_dismissed: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });

  return (
    <div className={cn("widget-container", compact ? "h-full" : "")}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              AI Insights
            </h3>
            <p className="font-mono text-[10px] text-muted-foreground/70">
              Powered by Gemini 2.5
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-mono text-[10px] text-muted-foreground">
            {insights?.length || 0} active
          </span>
        </div>
      </div>

      <ScrollArea className={compact ? "h-64" : "h-[500px]"}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-secondary/50 rounded-lg animate-pulse">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : insights && insights.length > 0 ? (
          <div className="p-4 space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 group",
                  !insight.is_read && "bg-primary/5 border-primary/20",
                  insight.is_read && "bg-secondary/50 border-border",
                  "hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0 border",
                      severityColors[insight.severity || "info"]
                    )}
                  >
                    {insightIcons[insight.insight_type] || insightIcons.trend}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {insight.insight_type}
                      </span>
                      {!insight.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="font-mono text-sm text-foreground mt-1 font-medium">
                      {insight.title}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
                      {insight.description}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/50 mt-2">
                      {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!insight.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => markAsRead.mutate(insight.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => dismiss.mutate(insight.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-mono text-sm text-muted-foreground mb-2">
              No active insights
            </p>
            <p className="font-mono text-xs text-muted-foreground/70">
              AI will analyze your data and surface important patterns
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
