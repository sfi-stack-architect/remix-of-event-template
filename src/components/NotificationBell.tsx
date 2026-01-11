import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X, TrendingUp, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDismissNotification,
  Notification,
} from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const severityStyles: Record<string, string> = {
  info: "border-l-primary",
  warning: "border-l-amber-500",
  critical: "border-l-destructive",
};

const insightIcons: Record<string, React.ReactNode> = {
  trend: <TrendingUp className="h-3.5 w-3.5" />,
  anomaly: <AlertTriangle className="h-3.5 w-3.5" />,
  recommendation: <Lightbulb className="h-3.5 w-3.5" />,
  prediction: <Activity className="h-3.5 w-3.5" />,
};

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkAsRead();
  const dismissNotification = useDismissNotification();

  const severity = notification.severity || "info";

  return (
    <div
      className={cn(
        "p-3 border-l-2 bg-card/50 hover:bg-card transition-colors relative group",
        severityStyles[severity] || severityStyles.info,
        !notification.is_read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
            severity === "critical" && "bg-destructive/10 text-destructive",
            severity === "warning" && "bg-amber-500/10 text-amber-500",
            severity === "info" && "bg-primary/10 text-primary"
          )}
        >
          {insightIcons[notification.insight_type] || insightIcons.trend}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-medium text-foreground truncate">
            {notification.title}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
            {notification.description}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => markAsRead.mutate(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => dismissNotification.mutate(notification.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-mono flex items-center justify-center text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-background border-border"
        align="end"
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            AI Insights
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] font-mono gap-1"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center">
              <p className="font-mono text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="font-mono text-xs text-muted-foreground">
                No AI insights yet
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
