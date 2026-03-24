'use client';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { usePathname } from 'next/navigation';

const DRAWER_WIDTH = 240;

// 路径 → 中文页面名称映射
const pageTitleMap: Record<string, string> = {
  'dashboard': '系统总览',
  'environmental-data': '环境数据',
  'behavior': '视频行为',
  'video-data': '视频数据',
  'data-analysis': '数据分析',
  'ragflow': '智能问答',
  'settings': '系统设置',
  'monitor': '实时监控',
  'history': '历史数据',
};

// 路径 → 面包屑映射（多段路径）
const getBreadcrumbs = (pathname: string): string[] => {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg) => pageTitleMap[seg] ?? seg);
};

const Header = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = getBreadcrumbs(pathname);

  // 取最后一段作为主标题
  const lastSeg = segments[segments.length - 1] || 'dashboard';
  const pageTitle = pageTitleMap[lastSeg] ?? lastSeg;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { sm: `${DRAWER_WIDTH}px` },
        backgroundColor: '#ffffff',
        color: 'text.primary',
        borderBottom: '1px solid rgba(46,125,50,0.12)',
        boxShadow: '0 1px 4px 0 rgba(46,125,50,0.08)',
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {/* 面包屑 + 标题 */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {breadcrumbs.length > 1 && (
            <>
              {breadcrumbs.slice(0, -1).map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                    {crumb}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.25, fontSize: '0.82rem' }}>
                    /
                  </Typography>
                </React.Fragment>
              ))}
            </>
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}
          >
            {pageTitle}
          </Typography>
        </Box>

        {/* 右侧操作区 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label="在线"
            size="small"
            sx={{
              backgroundColor: 'rgba(46,125,50,0.1)',
              color: '#2E7D32',
              fontSize: '0.7rem',
              height: 20,
              fontWeight: 600,
              mr: 1,
            }}
          />
          <IconButton color="inherit" size="small">
            <Badge badgeContent={4} color="warning">
              <NotificationsIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
            </Badge>
          </IconButton>
          <IconButton color="inherit" size="small">
            <AccountCircle sx={{ fontSize: 22, color: 'text.secondary' }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
