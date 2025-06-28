import React, { useState, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, responsiveFontSizes, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import LogsViewer from './components/LogsViewer';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';

// Create Grafana-inspired dark theme
const darkThemeOptions = {
  palette: {
    mode: 'dark' as const,
    primary: { main: '#5794F2' },
    secondary: { main: '#E5B45A' },
    background: { default: '#0B0C0E', paper: '#161719' },
    text: { primary: '#D8D9DA', secondary: '#8E8E8E' },
    divider: 'rgba(255, 255, 255, 0.12)',
    success: { main: '#73BF69' },
    warning: { main: '#F2CC0C' },
    error: { main: '#E02F44' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.25rem' },
    h5: { fontWeight: 500, fontSize: '1.125rem' },
    h6: { fontWeight: 500, fontSize: '1rem' },
    button: { textTransform: 'none' as const, fontWeight: 600 }
  },
  shape: { borderRadius: 4 },
  components: {
    MuiPaper: {
        styleOverrides: {
            root: { backgroundImage: 'none', border: '1px solid #2C2D32' }
        }
    }
  }
};

// Create Grafana-inspired light theme
const lightThemeOptions = {
  palette: {
    mode: 'light' as const,
    primary: { main: '#5794F2' },
    secondary: { main: '#E5B45A' },
    background: { default: '#F4F5F8', paper: '#FFFFFF' },
    text: { primary: '#161719', secondary: '#52545C' },
    divider: 'rgba(0, 0, 0, 0.12)',
    success: { main: '#1A7E3A' },
    warning: { main: '#B77E2A' },
    error: { main: '#BF2F38' },
  },
  // Share typography, shape, and component overrides
  typography: darkThemeOptions.typography,
  shape: darkThemeOptions.shape,
  components: {
      MuiPaper: {
          styleOverrides: {
              root: { backgroundImage: 'none', border: '1px solid #E0E0E0' }
          }
      }
  }
};

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');

  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(() => {
    const selectedTheme = mode === 'dark' ? darkThemeOptions : lightThemeOptions;
    return responsiveFontSizes(createTheme(selectedTheme));
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            mode={mode}
            toggleColorMode={toggleColorMode}
          />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              overflow: 'auto',
              transition: 'margin-left 0.3s',
              height: '100%',
              backgroundColor: 'background.default'
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/logs" element={<LogsViewer />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
