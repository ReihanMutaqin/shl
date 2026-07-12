import { useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";

export function useAuth() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      document.cookie = "session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      utils.auth.me.invalidate();
      navigate("/login");
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user: user || null,
    isLoading,
    isAdmin: user?.role === "admin",
    isPegawai: user?.role === "pegawai",
    logout,
  };
}
