import { createContext } from 'react';

const ThemeContext = createContext({
  themeType: 'light',
  toggleTheme: () => {},
});

export default ThemeContext;
