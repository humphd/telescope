import { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@material-ui/core/styles';
import Header from '../components/Header';
import UserProvider from '../components/UserProvider';

import '../styles/globals.css';
import usePreferredThemeColors from '../hooks/use-prefer-theme-colors';
import { darkTheme, lightTheme } from '../theme';
import ThemeContext from '../contexts/themeContext';

// Reference: https://github.com/mui-org/material-ui/blob/master/examples/nextjs/pages/_app.js
const App = ({ Component, pageProps }: AppProps) => {
  // This hook is for ensuring the styling is sync between client and server
  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  const preferredTheme = usePreferredThemeColors();

  const [theme, setTheme] = useState(preferredTheme);
  const [mounted, setMounted] = useState(false);

  // This hook is to ensure that right after the component mounted aka on client, display the client version of the app
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme.palette.type === 'light') {
      localStorage.setItem('theme', 'dark');
      setTheme(darkTheme);
    } else {
      localStorage.setItem('theme', 'light');
      setTheme(lightTheme);
    }
  };

  const app = (
    <ThemeProvider theme={theme}>
      <UserProvider>
        <ThemeContext.Provider value={{ themeType: theme.palette.type, toggleTheme }}>
          <Header />
        </ThemeContext.Provider>
        <Component {...pageProps} />
      </UserProvider>
    </ThemeProvider>
  );

  // This is to ensure that the client see the right view that matched expectation of their preference
  // On server it should show nothing, this is kinda a hack
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{app}</div>;
  }

  return app;
};

export default App;
