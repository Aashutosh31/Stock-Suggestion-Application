import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";

interface MeResponse {
  user: User;
  isGuest?: boolean;
}

export function useSession() {
  const { setSession, clear, status } = useAuthStore();
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const data = await api.get<MeResponse>("/auth/me");
        setSession(data.user, Boolean(data.isGuest));
        return data.user;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 0)) {
          clear();
          return null;
        }
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
    enabled: status === "unknown",
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<MeResponse>("/auth/login", input),
    onSuccess: (data) => {
      setSession(data.user, false);
      void qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) => api.post<MeResponse>("/auth/register", input),
    onSuccess: (data) => {
      setSession(data.user, false);
      void qc.invalidateQueries();
    },
  });
}

export function useDemoLogin() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: () => api.post<MeResponse>("/auth/demo"),
    onSuccess: (data) => {
      setSession(data.user, true);
      void qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => api.post<{ loggedOut: boolean }>("/auth/logout"),
    onSettled: () => {
      clear();
      qc.clear();
    },
  });
}

export function useCurrentUser(): User | null {
  return useAuthStore((s) => s.user);
}

export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  return useCallback(() => status === "authenticated" && user, [status, user]);
}
