import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            isLightMode: false,
            toggleLightMode: () => set((state) => {
                const newMode = !state.isLightMode;
                if (typeof document !== 'undefined') {
                    document.cookie = `eduai_theme=${newMode ? 'light' : 'dark'}; path=/; max-age=31536000; samesite=lax`;
                }
                return { isLightMode: newMode };
            }),
            setLightMode: (val) => set({ isLightMode: val })
        }),
        {
            name: 'theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state && typeof document !== 'undefined') {
                    document.cookie = `eduai_theme=${state.isLightMode ? 'light' : 'dark'}; path=/; max-age=31536000; samesite=lax`;
                }
            }
        }
    )
);
