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
import Collapse from '@mui/material/Collapse';

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SensorsIcon from '@mui/icons-material/Sensors';
import VideocamIcon from '@mui/icons-material/Videocam';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: '总览', href: '/dashboard', icon: <DashboardIcon /> },
  { text: '数据分析', href: '/analysis', icon: <AnalyticsIcon /> },
  { text: '告警中心', href: '/alerts', icon: <NotificationsIcon /> },
];

const settingsItem = {
  text: '设置',
  href: '/settings',
  icon: <SettingsIcon />,
};

const Sidebar = () => {
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {/* Non-collapsible items */}
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Collapsible "Realtime Monitor" item */}
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <MonitorHeartIcon />
          </ListItemIcon>
          <ListItemText primary="实时监控" />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4 }} component={Link} href="/monitor/environmental-data">
              <ListItemIcon>
                <SensorsIcon />
              </ListItemIcon>
              <ListItemText primary="环境数据" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4 }} component={Link} href="/monitor/behavior">
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary="行为监控" />
            </ListItemButton>
          </List>
        </Collapse>
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
