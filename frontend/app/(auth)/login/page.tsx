'use client';
import React from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  CssBaseline,
  Paper,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';

const LoginPage = () => {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          智慧牧场监控系统
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="用户名"
            name="username"
            autoComplete="username"
            autoFocus
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
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            登 录
          </Button>
          <Button
            component={Link}
            href="/dashboard"
            fullWidth
            variant="outlined"
            sx={{ mt: 1, mb: 2 }}
          >
            访客模式
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
