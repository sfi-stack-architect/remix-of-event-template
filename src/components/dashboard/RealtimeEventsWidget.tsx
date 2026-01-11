import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  MousePointerClick, 
  ScrollText, 
  Eye,
  LogIn,
  LogOut,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RealtimeEvent {
  id: string;
  event_type: string;
  page_path: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

const eventIcons: Record<string, React.ReactNode> = {
  session_start: <LogIn className="h-3 w-3" />,
  session_end: <LogOut className="h-3 w-3" />,
  scroll_depth: <ScrollText className="h-3 w-3" />,
  page_view: <Eye className="h-3 w-3" />,
  click: <MousePointerClick className="h-3 w-3" />,
  default: <Zap className="h-3 w-3" />,
};

const eventColors: Record<string, string> = {
  session_start: "bg-signal-nominal/10 text-signal-nominal",
  session_end: "bg-muted text-muted-foreground",
  scroll_depth: "bg-primary/10 text-primary",
  page_view: "bg-chart-5/10 text-chart-5",
  click: "bg-signal-warning/10 text-signal-warning",
  default: "bg-secondary text-muted-foreground",
};

export function RealtimeEventsWidget() {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initial load
    const loadEvents = async () => {
      const { data } = await supabase
        .from("analytics_events" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (data) {
        setEvents(data as RealtimeEvent[]);
      }
    };
    loadEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("realtime-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_events",
        },
        (payload) => {
          setEvents((prev) => [payload.new as RealtimeEvent, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="widget-container h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Live Event Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
              isLive
                ? "bg-signal-nominal/10 text-signal-nominal"
                : "bg-muted text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isLive ? "bg-signal-nominal animate-pulse" : "bg-muted-foreground"
              )}
            />
            <span className="font-mono text-[10px] uppercase">
              {isLive ? "Live" : "Paused"}
            </span>
          </button>
        </div>
      </div>

      <ScrollArea className="h-64">
        {events.length > 0 ? (
          <div className="divide-y divide-border">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "p-3 hover:bg-secondary/50 transition-colors",
                  index === 0 && isLive && "animate-fade-in bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0",
                      eventColors[event.event_type] || eventColors.default
                    )}
                  >
                    {eventIcons[event.event_type] || eventIcons.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {event.event_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {event.page_path && (
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
                        {event.page_path}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/50 flex-shrink-0">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2 animate-pulse" />
            <p className="font-mono text-xs text-muted-foreground">
              Waiting for events...
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Activity bar */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            Event Activity
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {events.length} recent
          </span>
        </div>
        <div className="flex gap-0.5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full",
                i < events.length ? "bg-primary" : "bg-secondary"
              )}
              style={{
                opacity: i < events.length ? 1 - i * 0.04 : 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
