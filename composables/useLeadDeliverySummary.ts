import type { LeadCounts } from "~/types/admin-lead";

export function useLeadDeliverySummary() {
  const counts = useState<LeadCounts | null>("lead-delivery-summary", () => null);
  const { apiFetch } = useApi();

  async function refreshLeadCounts() {
    try {
      counts.value = await apiFetch<LeadCounts>("/api/admin/leads/summary");
    } catch {
      counts.value = null;
    }
  }

  return { counts, refreshLeadCounts };
}
