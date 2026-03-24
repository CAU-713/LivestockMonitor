'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar />

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 3 },
          pb: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Header />
        <Toolbar />

        <Box
          sx={{
            mt: 2,
            borderRadius: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
