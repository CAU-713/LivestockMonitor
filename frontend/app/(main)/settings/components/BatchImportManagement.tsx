'use client';

import React, { useState, useRef } from 'react';
import {
  Box, Typography, Stack, Button, Paper, Alert, AlertTitle, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PetsIcon from '@mui/icons-material/Pets';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import { importApi, ImportResult } from '@/lib/api/apiService';

interface ImportSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onImport: (file: File) => Promise<ImportResult>;
  onDownloadTemplate: () => void;
  templateLabel: string;
  accept?: string;
}

function ImportSection({ title, description, icon, onImport, onDownloadTemplate, templateLabel, accept = '.xlsx,.xls,.csv' }: ImportSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await onImport(file);
      setResult(res);
    } catch (e: any) {
      setError(e.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Box>
          <Typography variant="h6" fontWeight={600}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{description}</Typography>
        </Box>
      </Stack>

      {/* 下载模板按钮 */}
      <Button
        variant="outlined" size="small" startIcon={<DownloadIcon />}
        onClick={onDownloadTemplate}
        sx={{ mb: 2, mr: 1 }}
      >
        {templateLabel}
      </Button>

      {/* 拖放上传区域 */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? '#1976d2' : '#ccc'}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragOver ? 'action.hover' : 'background.default',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: 'action.hover', borderColor: '#1976d2' },
        }}
      >
        {loading ? (
          <CircularProgress size={36} />
        ) : (
          <>
            <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" fontWeight={500}>点击或拖放文件至此处上传</Typography>
            <Typography variant="body2" color="text.secondary">支持 .xlsx、.xls、.csv 格式</Typography>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
      </Box>

      {/* 进度条 */}
      {loading && <LinearProgress sx={{ mt: 1 }} />}

      {/* 错误提示 */}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {/* 导入结果 */}
      {result && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={result.fail_count === 0 ? 'success' : result.success_count > 0 ? 'warning' : 'error'}>
            <AlertTitle>导入完成</AlertTitle>
            成功 {result.success_count} 条，失败 {result.fail_count} 条
          </Alert>
          {result.errors.length > 0 && (
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mt: 2, maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>行号</TableCell>
                    <TableCell>错误原因</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.errors.map((err, i) => (
                    <TableRow key={i}>
                      <TableCell><Chip label={`第 ${err.row} 行`} size="small" color="error" /></TableCell>
                      <TableCell>{err.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default function BatchImportManagement() {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>批量数据导入</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>使用说明</AlertTitle>
        请先下载对应的导入模板，按模板格式填写数据后上传。带 * 号的字段为必填项。
        导入失败的行不会写入数据库，成功的行会立即保存。
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ImportSection
            title="批量导入动物档案"
            description="支持批量录入动物基本信息：编号、品种、性别、出生日期、进场日期、圈舍等"
            icon={<PetsIcon sx={{ fontSize: 36 }} />}
            onImport={importApi.importAnimals}
            onDownloadTemplate={importApi.downloadAnimalTemplate}
            templateLabel="下载动物档案模板"
          />
        </Grid>
        <Grid item xs={12}>
          <ImportSection
            title="批量导入体重记录"
            description="支持批量录入动物体重测量数据：动物编号、测量日期、测量时间、体重"
            icon={<MonitorWeightIcon sx={{ fontSize: 36 }} />}
            onImport={importApi.importWeightRecords}
            onDownloadTemplate={importApi.downloadWeightTemplate}
            templateLabel="下载体重记录模板"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
