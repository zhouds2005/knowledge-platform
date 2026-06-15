import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function usePermissions(objectId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["permissions", objectId],
    queryFn: () => api(`/api/knowledge/${objectId}/permissions`),
    enabled: !!objectId,
  });

  const grants = data?.permissions ?? [];

  const updatePerms = useMutation({
    mutationFn: (newGrants: any[]) =>
      api(`/api/knowledge/${objectId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ grants: newGrants }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", objectId] });
    },
  });

  return { grants, isLoading, updatePermissions: updatePerms.mutate };
}
