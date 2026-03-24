'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import Link from 'next/link';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const features = [
  { icon: <MonitorHeartIcon sx={{ fontSize: 20 }} />, text: '实时环境监控，掌握牧场动态' },
  { icon: <NotificationsActiveIcon sx={{ fontSize: 20 }} />, text: '智能预警系统，异常即时通知' },
  { icon: <QueryStatsIcon sx={{ fontSize: 20 }} />, text: '数据分析报表，科学指导决策' },
];

const LoginPage = () => {
  const [role, setRole] = useState<'admin' | 'guest' | 'research'>('guest');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* 左侧：品牌展示区 */}
      <Box
        sx={{
          flex: { xs: '0 0 auto', md: '0 0 58%' },
          minHeight: { xs: 220, md: '100vh' },
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          px: { xs: 4, md: 8 },
          py: { xs: 5, md: 8 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 装饰圆圈（背景装饰） */}
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '5%',
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(165,214,167,0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo + 系统名 */}
        <Stack direction="row" alignItems="center" spacing={2} mb={4} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AgricultureIcon sx={{ color: '#ffffff', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800, lineHeight: 1.1 }}>
              智慧牧场
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Livestock Monitoring System
            </Typography>
          </Box>
        </Stack>

        {/* 主标题 */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <Typography
            variant="h3"
            sx={{
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.2,
              mb: 2,
              fontSize: { xs: '1.8rem', md: '2.4rem' },
            }}
          >
            智能化牧场管理
            <br />
            从这里开始
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 5,
              lineHeight: 1.7,
            }}
          >
            集成环境监测、行为识别、智能预警于一体，
            <br />
            为您的牧场提供全方位数字化管理方案。
          </Typography>

          {/* 特性列表 */}
          <Stack spacing={2}>
            {features.map((feature, idx) => (
              <Stack key={idx} direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A5D6A7',
                    flexShrink: 0,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {feature.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* 右侧：登录表单区 */}
      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 'auto', md: '100vh' },
          background: '#F1F8E9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 8 },
        }}
      >
        <Paper
          elevation={2}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(46,125,50,0.12)',
          }}
        >
          <Box mb={3.5}>
            <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
              欢迎回来 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              请登录以访问智慧牧场监控系统
            </Typography>
          </Box>

          <Box component="form" noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="用户名"
              name="username"
              autoComplete="username"
              autoFocus
              size="small"
              sx={{ mb: 1 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="密码"
              type="password"
              id="password"
              autoComplete="current-password"
              size="small"
              sx={{ mb: 2 }}
            />

            {/* 角色选择 */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                background: 'rgba(46,125,50,0.05)',
                border: '1px solid rgba(46,125,50,0.15)',
              }}
            >
              <FormLabel
                component="legend"
                sx={{ fontSize: '0.8rem', mb: 1, color: 'text.secondary', fontWeight: 600 }}
              >
                选择登录角色
              </FormLabel>
              <RadioGroup
                row
                value={role}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value as typeof role)}
              >
                <FormControlLabel
                  value="admin"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2">管理员</Typography>}
                />
                <FormControlLabel
                  value="research"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2">科研模式</Typography>}
                />
                <FormControlLabel
                  value="guest"
                  control={<Radio size="small" color="primary" />}
                  label={<Typography variant="body2">访客</Typography>}
                />
              </RadioGroup>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mb: 2, py: 1.2, fontSize: '1rem' }}
            >
              登 录
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                或者
              </Typography>
            </Divider>

            <Button
              component={Link}
              href="/dashboard"
              fullWidth
              variant="outlined"
              color="primary"
              sx={{ py: 1 }}
            >
              直接进入（访客模式）
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;
