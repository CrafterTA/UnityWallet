import { create } from 'zustand'

interface UIState {
  isDarkMode: boolean
  isLoading: boolean
  currentPage: string
  toggleDarkMode: () => void
  setLoading: (loading: boolean) => void
  setCurrentPage: (page: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  isDarkMode: false,
  isLoading: false,
  currentPage: '/',
  
  toggleDarkMode: () => set((state: UIState) => ({ isDarkMode: !state.isDarkMode })),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setCurrentPage: (page: string) => set({ currentPage: page }),
}))
