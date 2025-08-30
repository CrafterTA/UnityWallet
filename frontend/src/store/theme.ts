import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default to light theme
      isDark: false, // Default to light mode
      setTheme: (theme: Theme) => {
        set({ theme })
        
        // Apply theme to document
        const root = document.documentElement
        const isDark = theme === 'dark' || 
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        
        set({ isDark })
        
        if (isDark) {
          root.classList.add('dark')
          root.classList.remove('light')
        } else {
          root.classList.add('light')
          root.classList.remove('dark')
        }
      },
      
      // Initialize theme on mount
      init: () => {
        const { theme } = get()
        const root = document.documentElement
        const isDark = theme === 'dark' || 
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        
        set({ isDark })
        
        if (isDark) {
          root.classList.add('dark')
          root.classList.remove('light')
        } else {
          root.classList.add('light')
          root.classList.remove('dark')
        }
      }
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on app start
export const initializeTheme = () => {
  const store = useThemeStore.getState()
  const root = document.documentElement
  const isDark = store.theme === 'dark' || 
    (store.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  store.setTheme(store.theme) // This will trigger the theme application
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      useThemeStore.getState().setTheme('system')
    }
  })
}
