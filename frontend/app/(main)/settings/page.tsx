'use client';

import { useState } from 'react';
import { Container, Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import UserManagement from '@/app/(main)/settings/components/UserManagement';
import AuditLogManagement from '@/app/(main)/settings/components/AuditLogManagement';
import { useAuth } from '@/contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const { isAdmin } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth='xl' sx={{ py: 4 }}>
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label='settings tabs'
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 64,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                transform: 'translateY(-2px)',
              },
            },
          }}
        >
          <Tab
            label='用户管理'
            id='settings-tab-0'
            aria-controls='settings-tabpanel-0'
          />
          {isAdmin && (
            <Tab
              label='操作日志'
              id='settings-tab-1'
              aria-controls='settings-tabpanel-1'
            />
          )}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <UserManagement />
          </TabPanel>

          {isAdmin && (
            <TabPanel value={tabValue} index={1}>
              <AuditLogManagement />
            </TabPanel>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
