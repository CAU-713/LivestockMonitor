'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { AlertWebSocketProvider } from '@/contexts/AlertWebSocketContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AlertWebSocketProvider>
      <Box sx={{ display: 'flex' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: (theme) => theme.palette.background.default,
            minHeight: '100vh'
          }}
        >
          {/* Header */}
          <Header />

          {/* Toolbar spacer to push content down */}
          <Toolbar />

          {/* Page Content */}
          <Box sx={{ mt: 2 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </AlertWebSocketProvider>
  );
}