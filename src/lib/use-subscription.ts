import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { isSubscriptionActive, type SubscriptionRow } from "@/lib/membership";

export function useSubscription() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user && paymentsConfigured(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, cancel_at_period_end, price_id, created_at")
        .eq("user_id", user!.id)
        .eq("environment", getStripeEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as (SubscriptionRow & { created_at: string }) | null;
    },
  });
  // Backend access check: covers administrators and complimentary access too.
  const access = useQuery({
    queryKey: ["has-access", user?.id],
    enabled: !!user && paymentsConfigured(),
    queryFn: async () => {
      const { data } = await supabase.rpc("has_active_subscription", { user_uuid: user!.id, check_env: getStripeEnvironment() });
      return !!data;
    },
  });
  return {
    subscription: q.data ?? null,
    isActive: isSubscriptionActive(q.data) || access.data === true,
    loading: !!user && (q.isLoading || access.isLoading),
    refetch: q.refetch,
  };
}
