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
      main: '#1976d2', // A classic blue
    },
    secondary: {
      main: '#dc004e', // A vibrant pink for contrast
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    // ... you can define other typography styles here
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          elevation: 0,
        },
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRight: 'none',
            }
        }
    }
  },
});

export default theme;
