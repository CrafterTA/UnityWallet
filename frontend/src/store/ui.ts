import { create } from 'zustand'

interface UIState {
  isDarkMode: boolean
  isLoading: boolean
  currentPage: string
  showBalances: boolean
  sidebarCollapsed: boolean
  toggleDarkMode: () => void
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: string) => void
  toggleBalances: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  isLoading: false,
  currentPage: '/',
  showBalances: true,
  sidebarCollapsed: false,
  
  toggleDarkMode: () => set((state: UIState) => ({ isDarkMode: !state.isDarkMode })),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setCurrentPage: (page: string) => set({ currentPage: page }),
  toggleBalances: () => set((state: UIState) => ({ showBalances: !state.showBalances })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}))
