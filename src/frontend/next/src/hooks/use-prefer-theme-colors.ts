import { useMemo } from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { Theme } from '@material-ui/core';
import { darkTheme, lightTheme } from '../theme';

export default function usePreferredThemeColors(): Theme {
  const isDarkThemePreferred = useMediaQuery('(prefers-color-scheme: dark)');
  const preferredTheme = useMemo(() => (isDarkThemePreferred ? darkTheme : lightTheme), [
    isDarkThemePreferred,
  ]);

  // This portion of code only run on client
  if (typeof window !== 'undefined') {
    // First give priority to value stored in localStorage
    const storedSelectedTheme = localStorage.getItem('theme');
    if (storedSelectedTheme) {
      if (storedSelectedTheme === 'dark') {
        return darkTheme;
      }
      return lightTheme;
    }

    // If there is no value store in local storage then refer to the prefer-color-scheme
    const osPreferredTheme = isDarkThemePreferred ? 'dark' : 'light';

    // Set the theme value to localStorage for the first time
    localStorage.setItem('theme', osPreferredTheme);
    return preferredTheme;
  }

  // If run on server, return null;
  return lightTheme;
}
