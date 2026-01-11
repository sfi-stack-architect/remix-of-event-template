import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bell, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  TrendingUp,
  TrendingDown,
  Equal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Alert {
  id: string;
  name: string;
  metric_type: string;
  condition: string;
  threshold: number;
  is_active: boolean;
  notification_channels: string[];
  last_triggered_at: string | null;
  created_at: string;
}

const conditionIcons = {
  above: <TrendingUp className="h-3 w-3" />,
  below: <TrendingDown className="h-3 w-3" />,
  equals: <Equal className="h-3 w-3" />,
};

const metricOptions = [
  { value: "sessions_per_hour", label: "Sessions/Hour" },
  { value: "events_per_minute", label: "Events/Minute" },
  { value: "error_rate", label: "Error Rate (%)" },
  { value: "avg_session_duration", label: "Avg Session Duration (s)" },
  { value: "conversion_rate", label: "Conversion Rate (%)" },
];

export function AlertsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: "",
    metric_type: "sessions_per_hour",
    condition: "above",
    threshold: 100,
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("alerts" as never)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Alert[];
    },
    enabled: !!user,
  });

  const createAlert = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("alerts" as never).insert([{
        user_id: user.id,
        name: newAlert.name,
        metric_type: newAlert.metric_type,
        condition: newAlert.condition,
        threshold: newAlert.threshold,
        is_active: true,
        notification_channels: ["in_app"],
      }] as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setIsCreateOpen(false);
      setNewAlert({ name: "", metric_type: "sessions_per_hour", condition: "above", threshold: 100 });
      toast.success("Alert created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create alert: " + (error as Error).message);
    },
  });

  const toggleAlert = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("alerts" as never)
        .update({ is_active } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert deleted");
    },
  });

  return (
    <div className="widget-container">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-signal-warning/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-signal-warning" />
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Alert Configuration
            </h3>
            <p className="font-mono text-[10px] text-muted-foreground/70">
              {alerts?.filter((a) => a.is_active).length || 0} active alerts
            </p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="font-mono text-xs gap-1">
              <Plus className="h-3 w-3" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-mono">Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1 block">
                  Alert Name
                </label>
                <Input
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  placeholder="e.g., High Traffic Alert"
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground mb-1 block">
                  Metric
                </label>
                <Select
                  value={newAlert.metric_type}
                  onValueChange={(value) => setNewAlert({ ...newAlert, metric_type: value })}
                >
                  <SelectTrigger className="font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metricOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="font-mono text-sm">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-muted-foreground mb-1 block">
                    Condition
                  </label>
                  <Select
                    value={newAlert.condition}
                    onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                  >
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above" className="font-mono text-sm">Above</SelectItem>
                      <SelectItem value="below" className="font-mono text-sm">Below</SelectItem>
                      <SelectItem value="equals" className="font-mono text-sm">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-mono text-xs text-muted-foreground mb-1 block">
                    Threshold
                  </label>
                  <Input
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: Number(e.target.value) })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={() => createAlert.mutate()}
                disabled={!newAlert.name || createAlert.isPending}
                className="w-full font-mono text-sm"
              >
                {createAlert.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[500px]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-secondary/50 rounded-lg animate-pulse">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  alert.is_active
                    ? "bg-secondary/50 border-border"
                    : "bg-muted/30 border-border/50 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {alert.name}
                      </span>
                      {alert.is_active && (
                        <span className="h-2 w-2 rounded-full bg-signal-nominal animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {metricOptions.find((m) => m.value === alert.metric_type)?.label}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-muted-foreground font-mono text-[10px]">
                        {conditionIcons[alert.condition as keyof typeof conditionIcons]}
                        {alert.condition}
                      </span>
                      <span className="font-mono text-xs text-primary font-medium">
                        {alert.threshold}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleAlert.mutate({ id: alert.id, is_active: !alert.is_active })}
                    >
                      {alert.is_active ? (
                        <ToggleRight className="h-5 w-5 text-signal-nominal" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteAlert.mutate(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-mono text-sm text-muted-foreground mb-2">
              No alerts configured
            </p>
            <p className="font-mono text-xs text-muted-foreground/70 mb-4">
              Create alerts to get notified when metrics exceed thresholds
            </p>
            <Button
              size="sm"
              className="font-mono text-xs"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create First Alert
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
