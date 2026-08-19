'use client';
import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Import icons
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
import AgricultureIcon from '@mui/icons-material/Agriculture';
import StorageIcon from '@mui/icons-material/Storage';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import Badge from '@mui/material/Badge';
import GrassIcon from '@mui/icons-material/Grass';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { useAuth } from '@/contexts/AuthContext';
import { alertApi } from '@/lib/api/apiService';

const DRAWER_WIDTH = 240;

const ACTIVE_BG = 'rgba(255,255,255,0.18)';
const ACTIVE_TEXT = '#ffffff';
const INACTIVE_TEXT = 'rgba(255,255,255,0.75)';
const ICON_ACTIVE = '#A5D6A7';
const ICON_INACTIVE = 'rgba(255,255,255,0.65)';

const Sidebar = () => {
  const pathname = usePathname();
  const [realtimeOpen, setRealtimeOpen] = React.useState(true);
  const [historyOpen, setHistoryOpen] = React.useState(true);
  const [animalsOpen, setAnimalsOpen] = React.useState(true);
  const [unresolvedAlerts, setUnresolvedAlerts] = React.useState(0);

  // 根据角色控制数据分析菜单项可见性
  const { isGuest } = useAuth();

  // 加载未解决告警数量
  React.useEffect(() => {
    alertApi.getStats()
      .then((s) => setUnresolvedAlerts(s.unresolved))
      .catch(() => {});
    // 每分钟刷新一次
    const timer = setInterval(() => {
      alertApi.getStats()
        .then((s) => setUnresolvedAlerts(s.unresolved))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '?');

  const menuItemSx = (href: string) => ({
    borderRadius: '8px',
    mx: 1,
    mb: 0.25,
    color: isActive(href) ? ACTIVE_TEXT : INACTIVE_TEXT,
    backgroundColor: isActive(href) ? ACTIVE_BG : 'transparent',
    borderLeft: isActive(href) ? '3px solid #A5D6A7' : '3px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#ffffff',
    },
    transition: 'all 0.2s ease',
  });

  const iconSx = (href: string) => ({
    color: isActive(href) ? ICON_ACTIVE : ICON_INACTIVE,
    minWidth: 36,
  });

  const parentMenuSx = (open: boolean) => ({
    borderRadius: '8px',
    mx: 1,
    mb: 0.25,
    color: open ? '#ffffff' : INACTIVE_TEXT,
    backgroundColor: open ? 'rgba(255,255,255,0.08)' : 'transparent',
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.12)',
      color: '#ffffff',
    },
    transition: 'all 0.2s ease',
  });

  const parentIconSx = (open: boolean) => ({
    color: open ? '#A5D6A7' : ICON_INACTIVE,
    minWidth: 36,
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: 'none',
          background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)',
        },
      }}
      open
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          mb: 1,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AgricultureIcon sx={{ color: '#ffffff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, lineHeight: 1.2, fontSize: '0.95rem' }}>
            智慧牧场
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>
            监控管理平台
          </Typography>
        </Box>
      </Box>

      {/* 主菜单 */}
      <List sx={{ px: 0.5, flex: 1 }}>
        {/* Dashboard */}
        <ListItemButton component={Link} href="/dashboard" sx={menuItemSx('/dashboard')}>
          <ListItemIcon sx={iconSx('/dashboard')}>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="系统总览" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive('/dashboard') ? 600 : 400 }} />
        </ListItemButton>

        {/* 环境预测 */}
        <ListItemButton component={Link} href="/forecast" sx={menuItemSx('/forecast')}>
          <ListItemIcon sx={iconSx('/forecast')}>
            <TrendingUpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="环境预测" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive('/forecast') ? 600 : 400 }} />
        </ListItemButton>

        {/* 实时数据 */}
        <ListItemButton onClick={() => setRealtimeOpen(!realtimeOpen)} sx={parentMenuSx(realtimeOpen)}>
          <ListItemIcon sx={parentIconSx(realtimeOpen)}>
            <MonitorHeartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="实时数据" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
          {realtimeOpen
            ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 18 }} />
            : <ExpandMore sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 18 }} />
          }
        </ListItemButton>
        <Collapse in={realtimeOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton component={Link} href="/monitor/environmental-data" sx={{ ...menuItemSx('/monitor/environmental-data'), pl: 4 }}>
              <ListItemIcon sx={iconSx('/monitor/environmental-data')}>
                <SensorsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="环境数据" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive('/monitor/environmental-data') ? 600 : 400 }} />
            </ListItemButton>
            <ListItemButton component={Link} href="/monitor/behavior" sx={{ ...menuItemSx('/monitor/behavior'), pl: 4 }}>
              <ListItemIcon sx={iconSx('/monitor/behavior')}>
                <VideocamIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="视频行为" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive('/monitor/behavior') ? 600 : 400 }} />
            </ListItemButton>
          </List>
        </Collapse>

        {/* 历史数据 */}
        <ListItemButton onClick={() => setHistoryOpen(!historyOpen)} sx={parentMenuSx(historyOpen)}>
          <ListItemIcon sx={parentIconSx(historyOpen)}>
            <StorageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="历史数据" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
          {historyOpen
            ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 18 }} />
            : <ExpandMore sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 18 }} />
          }
        </ListItemButton>
        <Collapse in={historyOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton component={Link} href="/history/environmental-data" sx={{ ...menuItemSx('/history/environmental-data'), pl: 4 }}>
              <ListItemIcon sx={iconSx('/history/environmental-data')}>
                <SensorsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="环境数据" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive('/history/environmental-data') ? 600 : 400 }} />
            </ListItemButton>
            <ListItemButton component={Link} href="/history/video-data" sx={{ ...menuItemSx('/history/video-data'), pl: 4 }}>
              <ListItemIcon sx={iconSx('/history/video-data')}>
                <VideocamIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="视频数据" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive('/history/video-data') ? 600 : 400 }} />
            </ListItemButton>
            {/* 仅当非访客角色时显示数据分析 */}
            {!isGuest && (
              <ListItemButton component={Link} href="/history/data-analysis" sx={{ ...menuItemSx('/history/data-analysis'), pl: 4 }}>
                <ListItemIcon sx={iconSx('/history/data-analysis')}>
                  <QueryStatsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="数据分析" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive('/history/data-analysis') ? 600 : 400 }} />
              </ListItemButton>
            )}
          </List>
        </Collapse>

        {/* 智能问答 */}
        <ListItemButton component={Link} href="/ragflow" sx={menuItemSx('/ragflow')}>
          <ListItemIcon sx={iconSx('/ragflow')}>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="智能问答" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive('/ragflow') ? 600 : 400 }} />
        </ListItemButton>

        {/* 告警中心 */}
        <ListItemButton component={Link} href="/alerts" sx={menuItemSx('/alerts')}>
          <ListItemIcon sx={iconSx('/alerts')}>
            <Badge badgeContent={unresolvedAlerts || 0} color="error" max={99}>
              <NotificationsActiveIcon fontSize="small" />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="告警中心" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive('/alerts') ? 600 : 400 }} />
        </ListItemButton>

        {/* 动物管理 - 暂时隐藏（暂无数据） */}
        {/* 繁殖管理 - 暂时隐藏（暂无数据） */}
      </List>

      {/* 底部：设置 */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.12)', pt: 1, pb: 1 }}>
        <List sx={{ px: 0.5 }}>
          <ListItemButton component={Link} href="/settings" sx={menuItemSx('/settings')}>
            <ListItemIcon sx={iconSx('/settings')}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="系统设置" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive('/settings') ? 600 : 400 }} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
