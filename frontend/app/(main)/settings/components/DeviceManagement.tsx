'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Stack,
  IconButton,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { mockSheds, mockPens, mockSensors, mockCameras } from '@/constants/mockData';
import { Shed, Pen, Sensor, Camera } from '@/types';

type DeviceType = 'shed' | 'pen' | 'sensor' | 'camera';
type DeviceData = Shed | Pen | Sensor | Camera;

export default function DeviceManagement() {
  const [sheds, setSheds] = useState<Shed[]>(mockSheds);
  const [pens, setPens] = useState<Pen[]>(mockPens);
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [cameras, setCameras] = useState<Camera[]>(mockCameras);

  const [openDialog, setOpenDialog] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('shed');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const getDeviceList = (type: DeviceType) => {
    const lists: Record<DeviceType, any[]> = { shed: sheds, pen: pens, sensor: sensors, camera: cameras };
    return lists[type];
  };

  const setDeviceList = (type: DeviceType, data: any[]) => {
    const setters: Record<DeviceType, any> = { shed: setSheds, pen: setPens, sensor: setSensors, camera: setCameras };
    setters[type](data);
  };

  const getTypeLabel = (type: DeviceType) => {
    const labels: Record<DeviceType, string> = { shed: '畜舍', pen: '栏位', sensor: '传感器', camera: '摄像头' };
    return labels[type];
  };

  const handleOpenDialog = (type: DeviceType, device?: any) => {
    setDeviceType(type);
    if (device) {
      setEditingId(device.id);
      setFormData(device);
    } else {
      setEditingId(null);
      setFormData(getDefaultFormData(type));
    }
    setOpenDialog(true);
  };

  const getDefaultFormData = (type: DeviceType) => {
    const defaults: Record<DeviceType, any> = {
      shed: { name: '', location: '', capacity: '' },
      pen: { name: '', shedId: '', capacity: '' },
      sensor: { name: '', shedId: '', type: 'Temperature', location: '' },
      camera: { name: '', shedId: '', location: '' },
    };
    return defaults[type];
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleSave = () => {
    const list = getDeviceList(deviceType);
    if (editingId) {
      const updated = list.map((item) => (item.id === editingId ? formData : item));
      setDeviceList(deviceType, updated);
    } else {
      const newId = String(Math.max(...list.map((item) => parseInt(item.id)), 0) + 1);
      setDeviceList(deviceType, [...list, { ...formData, id: newId }]);
    }
    handleCloseDialog();
  };

  const handleDelete = (type: DeviceType, id: string) => {
    if (confirm(`确定要删除该${getTypeLabel(type)}吗？`)) {
      const list = getDeviceList(type).filter((item) => item.id !== id);
      setDeviceList(type, list);
    }
  };

  const renderTable = (type: DeviceType) => {
    const list = getDeviceList(type);
    let columns: string[] = [];

    switch (type) {
      case 'shed':
        columns = ['name', 'location', 'capacity'];
        break;
      case 'pen':
        columns = ['name', 'shedId', 'capacity'];
        break;
      case 'sensor':
        columns = ['name', 'type', 'location'];
        break;
      case 'camera':
        columns = ['name', 'location'];
        break;
    }

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(46,125,50,0.08)' }}>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {getColumnLabel(col)}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, textAlign: 'center', fontSize: '0.875rem' }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((item) => (
              <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'rgba(46,125,50,0.04)' } }}>
                {columns.map((col) => (
                  <TableCell key={col} sx={{ fontSize: '0.875rem' }}>
                    {item[col as keyof typeof item]}
                  </TableCell>
                ))}
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="编辑">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(type, item)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(type, item.id)}
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
    );
  };

  const getColumnLabel = (col: string) => {
    const labels: Record<string, string> = {
      name: '名称',
      location: '位置',
      capacity: '容量',
      shedId: '畜舍',
      type: '类型',
    };
    return labels[col] || col;
  };

  const renderFormFields = () => {
    const fields: Record<DeviceType, string[]> = {
      shed: ['name', 'location', 'capacity'],
      pen: ['name', 'shedId', 'capacity'],
      sensor: ['name', 'type', 'location'],
      camera: ['name', 'location'],
    };

    return fields[deviceType].map((field) => (
      <TextField
        key={field}
        fullWidth
        label={getColumnLabel(field)}
        value={formData[field] || ''}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        size="small"
      />
    ));
  };

  return (
    <Box>
      {/* 左侧：畜舍和栏位 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
        <Box>
          {(['shed', 'pen'] as const).map((type) => (
            <Accordion key={type} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500, flex: 1 }}>
                  {getTypeLabel(type)} ({getDeviceList(type).length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(type);
                  }}
                  component="span"
                  sx={{ mr: 1 }}
                >
                  添加
                </Button>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>{renderTable(type)}</AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* 右侧：传感器和摄像头 */}
        <Box>
          {(['sensor', 'camera'] as const).map((type) => (
            <Accordion key={type} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 500, flex: 1 }}>
                  {getTypeLabel(type)} ({getDeviceList(type).length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(type);
                  }}
                  component="span"
                  sx={{ mr: 1 }}
                >
                  添加
                </Button>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>{renderTable(type)}</AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? `编辑${getTypeLabel(deviceType)}` : `添加${getTypeLabel(deviceType)}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>{renderFormFields()}</Stack>
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
