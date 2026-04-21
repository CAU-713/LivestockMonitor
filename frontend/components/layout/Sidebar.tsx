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

// Import icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SensorsIcon from '@mui/icons-material/Sensors';
import VideocamIcon from '@mui/icons-material/Videocam';
import QueryStatsIcon from '@mui/icons-material/QueryStats'; // Icon for Data Analysis
import ChatIcon from '@mui/icons-material/Chat'; // Icon for AI/RAGFlow

const DRAWER_WIDTH = 240;

const settingsItem = {
  text: '设置',
  href: '/settings',
  icon: <SettingsIcon />,
};

const Sidebar = () => {
  const [realtimeOpen, setRealtimeOpen] = React.useState(true);
  const [historyOpen, setHistoryOpen] = React.useState(true);

  const handleRealtimeClick = () => {
    setRealtimeOpen(!realtimeOpen);
  };

  const handleHistoryClick = () => {
    setHistoryOpen(!historyOpen);
  };

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {/* Dashboard */}
        <ListItemButton component={Link} href="/dashboard">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="总览" />
        </ListItemButton>

        {/* Realtime Monitor (Collapsible) */}
        <ListItemButton onClick={handleRealtimeClick}>
          <ListItemIcon>
            <MonitorHeartIcon />
          </ListItemIcon>
          <ListItemText primary="实时数据展示" />
          {realtimeOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={realtimeOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              component={Link}
              href="/monitor/environmental-data"
            >
              <ListItemIcon>
                <SensorsIcon />
              </ListItemIcon>
              <ListItemText primary="环境数据" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              component={Link}
              href="/monitor/behavior"
            >
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary="视频数据" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Historical Data (Collapsible) */}
        <ListItemButton onClick={handleHistoryClick}>
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="历史数据" />{' '}
          {historyOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={historyOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              component={Link}
              href="/history/environmental-data"
            >
              <ListItemIcon>
                <SensorsIcon />
              </ListItemIcon>
              <ListItemText primary="环境数据" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              component={Link}
              href="/history/video-data"
            >
              <ListItemIcon>
                <VideocamIcon />
              </ListItemIcon>
              <ListItemText primary="视频数据" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              component={Link}
              href="/history/data-analysis" // Link to the new page
            >
              <ListItemIcon>
                <QueryStatsIcon />
              </ListItemIcon>
              <ListItemText primary="数据分析" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItemButton component={Link} href="/ragflow">
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary="智能问答" />
        </ListItemButton>

        <ListItemButton component={Link} href="/ragflow/agent">
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText primary="Agent" />
        </ListItemButton>

      </List>
      <Divider />
      <List>
        <ListItemButton component={Link} href={settingsItem.href}>
          <ListItemIcon>{settingsItem.icon}</ListItemIcon>
          <ListItemText primary={settingsItem.text} />
        </ListItemButton>
      </List>
    </div>
  );

  return (
    <Drawer
      variant="permanent"
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
