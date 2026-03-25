'use client';
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = 240;

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

const roleLabelMap: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: '管理员', color: '#1565C0', bg: 'rgba(21,101,192,0.1)' },
  research: { label: '科研模式', color: '#2E7D32', bg: 'rgba(46,125,50,0.1)' },
  guest: { label: '访客', color: '#6A1B9A', bg: 'rgba(106,27,154,0.1)' },
};

const getBreadcrumbs = (pathname: string): string[] => {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg) => pageTitleMap[seg] ?? seg);
};

const Header = () => {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = getBreadcrumbs(pathname);
  const lastSeg = segments[segments.length - 1] || 'dashboard';
  const pageTitle = pageTitleMap[lastSeg] ?? lastSeg;

  const { user, logout } = useAuth();
  const roleInfo = user ? roleLabelMap[user.roleMode] : null;

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
        <IconButton color="inherit" aria-label="open drawer" edge="start" sx={{ mr: 2, display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>

        {/* 面包屑 + 标题 */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {breadcrumbs.length > 1 && (
            <>
              {breadcrumbs.slice(0, -1).map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>{crumb}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.25, fontSize: '0.82rem' }}>/</Typography>
                </React.Fragment>
              ))}
            </>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.05rem' }}>
            {pageTitle}
          </Typography>
        </Box>

        {/* 右侧操作区 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 在线状态 */}
          <Chip
            label="在线"
            size="small"
            sx={{ backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32', fontSize: '0.7rem', height: 20, fontWeight: 600 }}
          />

          {/* 用户信息 */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.5 }}>
              <AccountCircle sx={{ fontSize: 22, color: 'text.secondary' }} />
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                  {user.name}
                </Typography>
                {roleInfo && (
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: roleInfo.color, fontWeight: 500, lineHeight: 1.2 }}>
                    {roleInfo.label}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* 通知 */}
          <IconButton color="inherit" size="small">
            <Badge badgeContent={4} color="warning">
              <NotificationsIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
            </Badge>
          </IconButton>

          {/* 退出登录 */}
          {user && (
            <Tooltip title="退出登录">
              <IconButton size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
                <LogoutIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
