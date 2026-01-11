import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  LogOut, 
  User, 
  Moon, 
  Sun,
  ChevronDown,
  Zap
} from "lucide-react";

export function ExecutiveHeader() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="executive-header h-16 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md gradient-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-mono text-sm font-semibold text-foreground">STRATUM</span>
            <span className="font-mono text-[10px] text-muted-foreground ml-2">Enterprise</span>
          </div>
        </Link>

        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-nominal/10 border border-signal-nominal/20">
          <div className="h-2 w-2 rounded-full bg-signal-nominal animate-pulse-glow" />
          <span className="font-mono text-[10px] text-signal-nominal uppercase tracking-wider">
            System Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Activity Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
          <Activity className="h-3 w-3 text-primary animate-pulse" />
          <span className="font-mono text-[10px] text-muted-foreground">
            Real-time Active
          </span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-mono">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="font-mono text-xs text-muted-foreground hidden sm:block">
                {user?.email?.split("@")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="font-mono text-xs">
              <User className="h-3 w-3 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="font-mono text-xs text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
