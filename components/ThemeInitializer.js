"use client";
import { useEffect } from 'react';
import { useTheme } from './ThemeContext';

export default function ThemeInitializer() {
  const { currentTheme, predefinedThemes, customThemes, accessibilitySettings } = useTheme();

  useEffect(() => {
    const themes = { ...predefinedThemes, ...customThemes };
    const theme = themes[currentTheme] || predefinedThemes.dark;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-border', theme.border);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-success', theme.success);
    root.style.setProperty('--color-warning', theme.warning);
    root.style.setProperty('--color-error', theme.error);

    // Accessibility
    const body = document.body;
    body.classList.remove('high-contrast', 'focus-indicators', 'larger-targets', 'sticky-focus', 'reduced-motion', 'font-small', 'font-medium', 'font-large');
    if (accessibilitySettings) {
      if (accessibilitySettings.highContrast) body.classList.add('high-contrast');
      if (accessibilitySettings.focusIndicators) body.classList.add('focus-indicators');
      if (accessibilitySettings.largerClickTargets) body.classList.add('larger-targets');
      if (accessibilitySettings.stickyFocus) body.classList.add('sticky-focus');
      if (accessibilitySettings.reducedMotion) {
        root.style.setProperty('--motion-duration', '0.01ms');
        body.classList.add('reduced-motion');
      } else {
        root.style.removeProperty('--motion-duration');
      }
      body.classList.add(`font-${accessibilitySettings.fontSize || 'medium'}`);
    }
  }, [currentTheme, predefinedThemes, customThemes, accessibilitySettings]);

  return null;
}
