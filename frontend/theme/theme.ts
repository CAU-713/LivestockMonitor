'use client';

import { createTheme, alpha } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: 'var(--color-primary)',
      light: 'var(--color-primary-soft)',
      dark: 'var(--color-primary-strong)',
      contrastText: '#ffffff',
    },
    secondary: {
      main: 'var(--color-secondary)',
    },
    success: {
      main: 'var(--color-success)',
    },
    warning: {
      main: 'var(--color-warning)',
    },
    error: {
      main: 'var(--color-danger)',
    },
    background: {
      default: 'var(--color-bg)',
      paper: 'var(--color-surface)',
    },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
    },
    divider: 'var(--color-border)',
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.65rem', fontWeight: 700 },
    h3: { fontSize: '1.35rem', fontWeight: 600 },
    h4: { fontSize: '1.2rem', fontWeight: 600 },
    h5: { fontSize: '1.05rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    subtitle1: { fontSize: '0.95rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500 },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', color: 'var(--color-text-tertiary)' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text-primary)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: `0 1px 0 0 var(--color-border), 0 6px 20px ${alpha('#0f172a', 0.04)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid var(--color-border)',
          boxShadow: `0 10px 30px ${alpha('#0f172a', 0.04)}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid var(--color-border)',
          boxShadow: `0 10px 30px ${alpha('#0f172a', 0.04)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
        },
      },
    },
  },
});

export default theme;
