import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { themes, applyTheme, getThemeById, type Theme } from '@/lib/themes';
import { apiRequest } from '@/lib/queryClient';

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => void;
  isChangingTheme: boolean;
  snowColor: string;
  setSnowColor: (color: string) => void;
  theme: {
    gradient: string;
    snowDensity: number;
    snowSpeed: number;
    snowColor: string;
  };
  showSnow: boolean;
  snowSettings: {
    density: number;
    speed: number;
  };
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
  user?: any;
  isAuthenticated?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, user, isAuthenticated }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const [snowColor, setSnowColorState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('snowColor') || '#ffffff';
    }
    return '#ffffff';
  });

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

  const setSnowColor = (color: string) => {
    setSnowColorState(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snowColor', color);
    }
  };

  const value = {
    currentTheme,
    themes,
    setTheme,
    isChangingTheme,
    snowColor,
    setSnowColor,
    theme: {
      gradient: currentTheme?.colors?.background || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      snowDensity: 50,
      snowSpeed: 1,
      snowColor: snowColor,
    },
    showSnow: true,
    snowSettings: {
      density: 50,
      speed: 1,
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};