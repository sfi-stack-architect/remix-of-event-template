import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "./useUserRoles";
import type { Json } from "@/integrations/supabase/types";

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useAuditLogs(limit = 100) {
  const { hasRole: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["audit-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
    enabled: isAdmin,
  });
}

export function useLogAudit() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
    }: {
      action: string;
      resourceType: string;
      resourceId?: string;
      oldValues?: Json;
      newValues?: Json;
    }) => {
      if (!user) return;

      const { error } = await supabase.from("audit_logs" as never).insert([{
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        user_agent: navigator.userAgent,
      }] as never);

      if (error) throw error;
    },
  });
}
