export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Default Dark",
    colors: {
      background: "hsl(222, 84%, 4.9%)",
      foreground: "hsl(210, 40%, 98%)",
      card: "hsl(222, 84%, 4.9%)",
      cardForeground: "hsl(210, 40%, 98%)",
      popover: "hsl(222, 84%, 4.9%)",
      popoverForeground: "hsl(210, 40%, 98%)",
      primary: "hsl(221, 83%, 53%)",
      primaryForeground: "hsl(210, 40%, 98%)",
      secondary: "hsl(217, 32%, 17%)",
      secondaryForeground: "hsl(210, 40%, 98%)",
      muted: "hsl(217, 32%, 17%)",
      mutedForeground: "hsl(215, 20%, 65%)",
      accent: "hsl(217, 32%, 17%)",
      accentForeground: "hsl(210, 40%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(217, 32%, 17%)",
      input: "hsl(217, 32%, 17%)",
      ring: "hsl(221, 83%, 53%)",
    }
  },
  {
    id: "crimson",
    name: "Crimson",
    colors: {
      background: "hsl(345, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(345, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(345, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(346, 77%, 49%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(345, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(345, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(345, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(345, 50%, 10%)",
      input: "hsl(345, 50%, 10%)",
      ring: "hsl(346, 77%, 49%)",
    }
  },
  {
    id: "emerald",
    name: "Emerald",
    colors: {
      background: "hsl(150, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(150, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(150, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(151, 77%, 49%)",
      primaryForeground: "hsl(0, 0%, 2%)",
      secondary: "hsl(150, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(150, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(150, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(150, 50%, 10%)",
      input: "hsl(150, 50%, 10%)",
      ring: "hsl(151, 77%, 49%)",
    }
  },
  {
    id: "violet",
    name: "Violet",
    colors: {
      background: "hsl(260, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(260, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(260, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(263, 70%, 50%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(260, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(260, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(260, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(260, 50%, 10%)",
      input: "hsl(260, 50%, 10%)",
      ring: "hsl(263, 70%, 50%)",
    }
  },
  {
    id: "orange",
    name: "Orange",
    colors: {
      background: "hsl(20, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(20, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(20, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(24, 95%, 53%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(20, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(20, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(20, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(20, 50%, 10%)",
      input: "hsl(20, 50%, 10%)",
      ring: "hsl(24, 95%, 53%)",
    }
  },
  {
    id: "cyan",
    name: "Cyan",
    colors: {
      background: "hsl(195, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(195, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(195, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(188, 95%, 53%)",
      primaryForeground: "hsl(0, 0%, 2%)",
      secondary: "hsl(195, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(195, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(195, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(195, 50%, 10%)",
      input: "hsl(195, 50%, 10%)",
      ring: "hsl(188, 95%, 53%)",
    }
  },
  {
    id: "pink",
    name: "Pink",
    colors: {
      background: "hsl(320, 82%, 4%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(320, 82%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(320, 82%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(322, 84%, 60%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(320, 50%, 10%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(320, 50%, 10%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(320, 50%, 10%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(320, 50%, 10%)",
      input: "hsl(320, 50%, 10%)",
      ring: "hsl(322, 84%, 60%)",
    }
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      background: "hsl(220, 30%, 2%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(220, 30%, 3%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(220, 30%, 3%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(217, 91%, 60%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(220, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(220, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(220, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(220, 20%, 8%)",
      input: "hsl(220, 20%, 8%)",
      ring: "hsl(217, 91%, 60%)",
    }
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      background: "hsl(120, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(120, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(120, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(142, 76%, 36%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(120, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(120, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(120, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(120, 20%, 8%)",
      input: "hsl(120, 20%, 8%)",
      ring: "hsl(142, 76%, 36%)",
    }
  },
  {
    id: "amber",
    name: "Amber",
    colors: {
      background: "hsl(45, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(45, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(45, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(48, 96%, 53%)",
      primaryForeground: "hsl(0, 0%, 2%)",
      secondary: "hsl(45, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(45, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(45, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(45, 20%, 8%)",
      input: "hsl(45, 20%, 8%)",
      ring: "hsl(48, 96%, 53%)",
    }
  },
  {
    id: "indigo",
    name: "Indigo",
    colors: {
      background: "hsl(240, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(240, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(240, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(239, 84%, 67%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(240, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(240, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(240, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(240, 20%, 8%)",
      input: "hsl(240, 20%, 8%)",
      ring: "hsl(239, 84%, 67%)",
    }
  },
  {
    id: "rose",
    name: "Rose",
    colors: {
      background: "hsl(350, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(350, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(350, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(346, 77%, 49%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(350, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(350, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(350, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(350, 20%, 8%)",
      input: "hsl(350, 20%, 8%)",
      ring: "hsl(346, 77%, 49%)",
    }
  },
  {
    id: "lime",
    name: "Lime",
    colors: {
      background: "hsl(80, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(80, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(80, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(84, 81%, 44%)",
      primaryForeground: "hsl(0, 0%, 2%)",
      secondary: "hsl(80, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(80, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(80, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(80, 20%, 8%)",
      input: "hsl(80, 20%, 8%)",
      ring: "hsl(84, 81%, 44%)",
    }
  },
  {
    id: "teal",
    name: "Teal",
    colors: {
      background: "hsl(180, 30%, 3%)",
      foreground: "hsl(0, 0%, 98%)",
      card: "hsl(180, 30%, 4%)",
      cardForeground: "hsl(0, 0%, 98%)",
      popover: "hsl(180, 30%, 4%)",
      popoverForeground: "hsl(0, 0%, 98%)",
      primary: "hsl(173, 80%, 40%)",
      primaryForeground: "hsl(0, 0%, 98%)",
      secondary: "hsl(180, 20%, 8%)",
      secondaryForeground: "hsl(0, 0%, 98%)",
      muted: "hsl(180, 20%, 8%)",
      mutedForeground: "hsl(0, 0%, 65%)",
      accent: "hsl(180, 20%, 8%)",
      accentForeground: "hsl(0, 0%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(180, 20%, 8%)",
      input: "hsl(180, 20%, 8%)",
      ring: "hsl(173, 80%, 40%)",
    }
  },
  {
    id: "slate",
    name: "Slate",
    colors: {
      background: "hsl(210, 20%, 2%)",
      foreground: "hsl(210, 40%, 98%)",
      card: "hsl(210, 20%, 3%)",
      cardForeground: "hsl(210, 40%, 98%)",
      popover: "hsl(210, 20%, 3%)",
      popoverForeground: "hsl(210, 40%, 98%)",
      primary: "hsl(210, 40%, 50%)",
      primaryForeground: "hsl(210, 40%, 98%)",
      secondary: "hsl(210, 15%, 8%)",
      secondaryForeground: "hsl(210, 40%, 98%)",
      muted: "hsl(210, 15%, 8%)",
      mutedForeground: "hsl(210, 40%, 65%)",
      accent: "hsl(210, 15%, 8%)",
      accentForeground: "hsl(210, 40%, 98%)",
      destructive: "hsl(0, 84%, 60%)",
      destructiveForeground: "hsl(210, 40%, 98%)",
      border: "hsl(210, 15%, 8%)",
      input: "hsl(210, 15%, 8%)",
      ring: "hsl(210, 40%, 50%)",
    }
  }
];

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });
};

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};