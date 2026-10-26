import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { configureApi } from '@/services/api'
import type { Role } from '@/types'

export type UiLanguage = 'en' | 'hi'
export type ThemeMode = 'light' | 'dark'

interface SessionState {
  /** Not persisted: the app always opens as a District Officer. */
  role: Role
  language: UiLanguage
  theme: ThemeMode
  sidebarCollapsed: boolean
  tourOpen: boolean
  tourStep: number
  setRole: (role: Role) => void
  setLanguage: (language: UiLanguage) => void
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  openTour: () => void
  closeTour: () => void
  setTourStep: (step: number) => void
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: 'district_officer',
      language: 'en',
      theme: 'light',
      sidebarCollapsed: false,
      tourOpen: false,
      tourStep: 0,
      setRole: (role) => set({ role }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => {
        applyThemeClass(theme)
        set({ theme })
      },
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark'
          applyThemeClass(next)
          return { theme: next }
        }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openTour: () => set({ tourOpen: true }),
      closeTour: () => set({ tourOpen: false }),
      setTourStep: (tourStep) => set({ tourStep }),
    }),
    {
      name: 'resilientepi-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ language: s.language, theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeClass(state.theme)
        }
      },
    },
  ),
)

configureApi({ getRole: () => useSession.getState().role })

export { ROLE_LABELS } from '@/config/roles'

export function useCanEdit(): boolean {
  return useSession((s) => s.role === 'district_officer')
}

export const READ_ONLY_REASON = 'Evaluators have read-only access. Switch role in the profile menu to make changes.'
