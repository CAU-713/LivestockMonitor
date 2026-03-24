'use client';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { usePathname } from 'next/navigation';

const DRAWER_WIDTH = 240;

const titleMap: Record<string, string> = {
  dashboard: '科研总览',
  monitor: '实时监测',
  'environmental-data': '环境数据',
  behavior: '行为视频',
  history: '历史数据',
  'video-data': '历史视频',
  'data-analysis': '数据分析',
  ragflow: '智能问答',
  settings: '系统设置',
};

const Header = () => {
  const pathname = usePathname();
  const currentPath = pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const pageTitle = titleMap[currentPath] || '科研平台';

  return (
    <AppBar
      position='fixed'
      sx={{
        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: `${DRAWER_WIDTH}px` },
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ minHeight: '68px !important' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='h6' noWrap component='div'>
            {pageTitle}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Livestock Research Monitoring Platform
          </Typography>
        </Box>
        <Chip size='small' color='primary' variant='outlined' label='课题组内部版' sx={{ mr: 1.5 }} />
        <IconButton color='inherit'>
          <Badge badgeContent={4} color='primary'>
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <IconButton color='inherit'>
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
