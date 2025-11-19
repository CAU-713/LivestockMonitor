'use client';
import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Link from 'next/link';

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorIcon from '@mui/icons-material/Monitor';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: '总览', href: '/dashboard', icon: <DashboardIcon /> },
  { text: '行为监控', href: '/monitor', icon: <MonitorIcon /> },
  { text: '实时数据', href: '/realtime-data', icon: <MonitorIcon /> },
  { text: '告警中心', href: '/alerts', icon: <NotificationsIcon /> },
  { text: '数据分析', href: '/analysis', icon: <AnalyticsIcon /> },
];

const settingsItem = {
  text: '设置',
  href: '/settings',
  icon: <SettingsIcon />,
};

const Sidebar = () => {
  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={settingsItem.href}>
            <ListItemIcon>{settingsItem.icon}</ListItemIcon>
            <ListItemText primary={settingsItem.text} />
          </ListItemButton>
        </ListItem>
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
