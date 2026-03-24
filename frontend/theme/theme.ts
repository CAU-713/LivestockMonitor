'use client';
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32',      // 深草绿
      dark: '#1B5E20',      // 更深绿，侧边栏背景
      light: '#81C784',     // 浅绿，hover/高亮
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F57C00',      // 琥珀橙，预警/强调
      dark: '#E65100',
      light: '#FFB74D',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F1F8E9',   // 极淡草绿背景
      paper: '#ffffff',
    },
    success: {
      main: '#43A047',
      light: '#A5D6A7',
    },
    warning: {
      main: '#FB8C00',
      light: '#FFE0B2',
    },
    error: {
      main: '#E53935',
      light: '#FFCDD2',
    },
    info: {
      main: '#1565C0',
      light: '#BBDEFB',
    },
    divider: 'rgba(46, 125, 50, 0.12)',
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
          color: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 8px 0 rgba(46,125,50,0.08)',
        },
        elevation2: {
          boxShadow: '0 2px 12px 0 rgba(46,125,50,0.10)',
        },
        elevation3: {
          boxShadow: '0 4px 16px 0 rgba(46,125,50,0.12)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
            boxShadow: '0 4px 12px rgba(46,125,50,0.4)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.04)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#2E7D32',
          height: 3,
          borderRadius: 2,
        },
      },
    },
  },
});

export default theme;
