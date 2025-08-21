import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isDark: true,
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
    }),
    {
      name: 'theme-storage',
    }
  )
)

// Initialize theme on app start
export const initializeTheme = () => {
  const { theme } = useThemeStore.getState()
  useThemeStore.getState().setTheme(theme)
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
