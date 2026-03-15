import { create } from 'zustand';

interface SidebarState {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isMobileOpen: false,
  isCollapsed: true,
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}));
