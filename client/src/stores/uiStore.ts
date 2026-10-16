import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeChoice = "dark" | "light" | "system";

interface UiState {
  sidebarCollapsed: boolean;
  theme: ThemeChoice;
  compactNumbers: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeChoice) => void;
  setCompactNumbers: (compact: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: "dark",
      compactNumbers: true,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
      setCompactNumbers: (compactNumbers) => set({ compactNumbers }),
    }),
    { name: "nivesh-ui" },
  ),
);
