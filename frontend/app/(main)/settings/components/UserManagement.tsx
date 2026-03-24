'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { mockUsers } from '@/constants/mockData';
import { User } from '@/types';

type UserFormData = Omit<User, 'id' | 'createdAt'> & { id?: string };

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role: 'user',
    status: 'active',
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        email: '',
        role: 'user',
        status: 'active',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.username || !formData.email) {
      alert('请填写所有必填字段');
      return;
    }

    if (editingId) {
      setUsers(
        users.map((u) =>
          u.id === editingId
            ? {
                ...u,
                username: formData.username,
                email: formData.email,
                role: formData.role,
                status: formData.status,
              }
            : u,
        ),
      );
    } else {
      const newUser: User = {
        id: String(Math.max(...users.map((u) => parseInt(u.id)), 0) + 1),
        username: formData.username,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([...users, newUser]);
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该用户吗？')) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'error' | 'warning' | 'success'> = {
      admin: 'error',
      user: 'warning',
      visitor: 'success',
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      user: '用户',
      visitor: '访客',
    };
    return labels[role] || role;
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? '活跃' : '未激活';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          添加用户
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(46,125,50,0.08)' }}>
              <TableCell sx={{ fontWeight: 600 }}>用户名</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>邮箱</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>角色</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>创建日期</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(46,125,50,0.04)' },
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    size="small"
                    color={getRoleColor(user.role)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(user.status)}
                    size="small"
                    color={user.status === 'active' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{user.createdAt}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(user)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(user.id)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? '编辑用户' : '添加新用户'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              size="small"
              placeholder="输入用户名"
            />
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              size="small"
              placeholder="输入邮箱地址"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>角色</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                label="角色"
              >
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="user">用户</MenuItem>
                <MenuItem value="visitor">访客</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>状态</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                label="状态"
              >
                <MenuItem value="active">活跃</MenuItem>
                <MenuItem value="inactive">未激活</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
