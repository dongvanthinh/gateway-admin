import 'src/global.css';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { usePathname } from 'src/routes/hooks';

import { themeConfig, ThemeProvider } from 'src/theme';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider defaultSettings={defaultSettings}>
          <ThemeProvider
            modeStorageKey={themeConfig.modeStorageKey}
            defaultMode={themeConfig.defaultMode}
          >
            <MotionLazy>
              <ProgressBar />
              <SettingsDrawer defaultSettings={defaultSettings} />
              {children}
            </MotionLazy>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
