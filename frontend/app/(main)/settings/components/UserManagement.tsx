'use client';
import { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { mockUsers } from '@/constants/mockData';
import { User } from '@/types';
import { userApi } from '@/lib/api/apiService';

type UserFormData = {
  username: string;
  password?: string;
  role: 'admin' | 'user' | 'visitor';
  status: 'active' | 'inactive';
};

// 前端角色 → 后端 role 数字
const roleToNum: Record<string, number> = { admin: 0, visitor: 1, user: 2 };
// 后端 role 数字 → 前端角色字符串
const numToRole: Record<number, 'admin' | 'user' | 'visitor'> = { 0: 'admin', 1: 'visitor', 2: 'user' };

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    role: 'user',
    status: 'active',
  });

  // 初始化时从后端加载用户
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const apiUsers = await userApi.getUsers();
        if (apiUsers.length > 0) setUsers(apiUsers);
      } catch (e) {
        console.warn('UserManagement: failed to load users, using mock', e);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ username: user.username, password: '', role: user.role as any, status: user.status as any });
    } else {
      setEditingId(null);
      setFormData({ username: '', password: '', role: 'user', status: 'active' });
    }
    setError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.username) {
      setError('请填写用户名');
      return;
    }
    if (!editingId && !formData.password) {
      setError('请填写密码');
      return;
    }

    try {
      if (editingId) {
        const updateData: any = { name: formData.username, role: roleToNum[formData.role] ?? 2 };
        if (formData.password) updateData.password = formData.password;
        await userApi.updateUser(parseInt(editingId), updateData);
        setUsers(users.map((u) =>
          u.id === editingId
            ? { ...u, username: formData.username, role: formData.role, status: formData.status }
            : u
        ));
      } else {
        const created = await userApi.createUser({
          name: formData.username,
          password: formData.password!,
          role: roleToNum[formData.role] ?? 2,
        });
        const newUser: User = {
          id: String(created.id),
          username: created.name,
          email: '',
          role: numToRole[created.role] ?? 'user',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setUsers([...users, newUser]);
      }
      handleCloseDialog();
    } catch (e: any) {
      setError(e.message || '操作失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该用户吗？')) {
      try {
        await userApi.deleteUser(parseInt(id));
        setUsers(users.filter((u) => u.id !== id));
      } catch (e: any) {
        alert(`删除失败：${e.message}`);
      }
    }
  };

  const getRoleColor = (role: string): 'error' | 'warning' | 'success' | 'default' => {
    const map: Record<string, 'error' | 'warning' | 'success'> = { admin: 'error', user: 'warning', visitor: 'success' };
    return map[role] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = { admin: '管理员', user: '科研用户', visitor: '访客' };
    return map[role] || role;
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          添加用户
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#2E7D32' }} />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(46,125,50,0.08)' }}>
                <TableCell sx={{ fontWeight: 600 }}>用户名</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>角色</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>状态</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: 'rgba(46,125,50,0.04)' } }}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip label={getRoleLabel(user.role)} size="small" color={getRoleColor(user.role)} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status === 'active' ? '活跃' : '未激活'}
                      size="small"
                      color={user.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Tooltip title="编辑">
                      <IconButton size="small" onClick={() => handleOpenDialog(user)} sx={{ color: 'primary.main' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="删除">
                      <IconButton size="small" onClick={() => handleDelete(user.id)} sx={{ color: '#d32f2f' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editingId ? '编辑用户' : '添加新用户'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
            <TextField
              fullWidth label="用户名" size="small"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <TextField
              fullWidth label={editingId ? '新密码（留空不修改）' : '密码'}
              type="password" size="small"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>角色</InputLabel>
              <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} label="角色">
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="user">科研用户</MenuItem>
                <MenuItem value="visitor">访客</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSave} variant="contained" color="primary">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
