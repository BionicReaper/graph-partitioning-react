import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface ColorMode {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const systemPrefersDark = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;

const ColorModeContext = createContext<ColorMode | null>(null);

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
    const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('darkMode', systemPrefersDark);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', isDarkMode);
        root.classList.toggle('light', !isDarkMode);
        root.style.colorScheme = isDarkMode ? 'dark' : 'light';
    }, [isDarkMode]);

    const value = useMemo<ColorMode>(() => ({
        isDarkMode,
        toggleDarkMode: () => setIsDarkMode((prev) => !prev),
    }), [isDarkMode, setIsDarkMode]);

    return (
        <ColorModeContext.Provider value={value}>
            {children}
        </ColorModeContext.Provider>
    );
};

export const useColorMode = (): ColorMode => {
    const context = useContext(ColorModeContext);
    if (!context) throw new Error('useColorMode must be used inside a ColorModeProvider');
    return context;
};
