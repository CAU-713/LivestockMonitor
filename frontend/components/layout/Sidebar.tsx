'use client';
import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';

import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SensorsIcon from '@mui/icons-material/Sensors';
import VideocamIcon from '@mui/icons-material/Videocam';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ChatIcon from '@mui/icons-material/Chat';

const DRAWER_WIDTH = 240;

const settingsItem = {
  text: '设置',
  href: '/settings',
  icon: <SettingsIcon />,
};

const navButtonSx = {
  '&.Mui-selected': {
    backgroundColor: 'primary.light',
    color: 'primary.dark',
    '& .MuiListItemIcon-root': {
      color: 'primary.dark',
    },
  },
  '&.Mui-selected:hover': {
    backgroundColor: 'primary.light',
  },
};

const Sidebar = () => {
  const pathname = usePathname();
  const [realtimeOpen, setRealtimeOpen] = React.useState(true);
  const [historyOpen, setHistoryOpen] = React.useState(true);

  const drawerContent = (
    <div>
      <Toolbar>
        <Box>
          <Typography variant='subtitle1' fontWeight={700}>
            畜牧科研平台
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Livestock Monitor
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        <ListItemButton component={Link} href='/dashboard' selected={pathname === '/dashboard'} sx={navButtonSx}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary='总览' />
        </ListItemButton>

        <ListItemButton onClick={() => setRealtimeOpen(!realtimeOpen)}>
          <ListItemIcon>
            <MonitorHeartIcon />
          </ListItemIcon>
          <ListItemText primary='实时数据展示' />
          {realtimeOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={realtimeOpen} timeout='auto' unmountOnExit>
          <List component='div' disablePadding>
            <ListItemButton
              sx={{ pl: 4, ...navButtonSx }}
              component={Link}
              href='/monitor/environmental-data'
              selected={pathname === '/monitor/environmental-data'}
            >
              <ListItemIcon>
                <SensorsIcon />
              </ListItemIcon>
              <ListItemText primary='环境数据' />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4, ...navButtonSx }}
              component={Link}
              href='/monitor/behavior'
              selected={pathname === '/monitor/behavior'}
            >
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary='视频数据' />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton onClick={() => setHistoryOpen(!historyOpen)}>
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary='历史数据' />
          {historyOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={historyOpen} timeout='auto' unmountOnExit>
          <List component='div' disablePadding>
            <ListItemButton
              sx={{ pl: 4, ...navButtonSx }}
              component={Link}
              href='/history/environmental-data'
              selected={pathname === '/history/environmental-data'}
            >
              <ListItemIcon>
                <SensorsIcon />
              </ListItemIcon>
              <ListItemText primary='环境数据' />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4, ...navButtonSx }}
              component={Link}
              href='/history/video-data'
              selected={pathname === '/history/video-data'}
            >
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary='视频数据' />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4, ...navButtonSx }}
              component={Link}
              href='/history/data-analysis'
              selected={pathname === '/history/data-analysis'}
            >
              <ListItemIcon>
                <QueryStatsIcon />
              </ListItemIcon>
              <ListItemText primary='数据分析' />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton component={Link} href='/ragflow' selected={pathname === '/ragflow'} sx={navButtonSx}>
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary='智能问答' />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItemButton component={Link} href={settingsItem.href} selected={pathname === '/settings'} sx={navButtonSx}>
          <ListItemIcon>{settingsItem.icon}</ListItemIcon>
          <ListItemText primary={settingsItem.text} />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Drawer
      variant='permanent'
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
