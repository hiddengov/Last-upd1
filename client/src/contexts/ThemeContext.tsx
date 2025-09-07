import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, applyTheme, getThemeById, type Theme } from '@/lib/themes';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => void;
  isChangingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.theme) {
      const theme = getThemeById(user.theme) || themes[0];
      setCurrentTheme(theme);
      applyTheme(theme);
    } else {
      // Apply default theme for non-authenticated users
      const defaultTheme = themes[0];
      setCurrentTheme(defaultTheme);
      applyTheme(defaultTheme);
    }
  }, [user, isAuthenticated]);

  const setTheme = async (themeId: string) => {
    const theme = getThemeById(themeId);
    if (!theme || !isAuthenticated) return;

    setIsChangingTheme(true);
    try {
      // Update theme on server
      await apiRequest('PUT', '/api/user/theme', { theme: themeId });
      
      // Apply theme locally
      setCurrentTheme(theme);
      applyTheme(theme);
      
      // Update user data in localStorage
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.theme = themeId;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  const value = {
    currentTheme,
    themes,
    setTheme,
    isChangingTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};