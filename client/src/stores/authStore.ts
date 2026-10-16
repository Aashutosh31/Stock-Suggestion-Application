import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isGuest: boolean;
  status: "unknown" | "authenticated" | "anonymous";
  setSession: (user: User, isGuest: boolean) => void;
  clear: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isGuest: false,
  status: "unknown",
  setSession: (user, isGuest) => set({ user, isGuest, status: "authenticated" }),
  clear: () => set({ user: null, isGuest: false, status: "anonymous" }),
  updateUser: (user) => set({ user }),
}));
