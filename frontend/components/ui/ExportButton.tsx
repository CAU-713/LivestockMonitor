'use client';
import React from 'react';
import { Button } from '@mui/material';
import dayjs from 'dayjs';

interface ExportButtonProps {
  data: Array<Record<string, any>>;
  fileName?: string;
  headerRow?: string[];
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName = 'export_data',
  headerRow,
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const escapeCell = (v: any): string => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };

    // If headerRow not provided, use keys from first data object
    const headers =
      headerRow || (data.length > 0 ? Object.keys(data[0]) : []);

    // Build CSV rows
    const csvRows: string[] = [];
    
    // Add header row
    csvRows.push(headers.map(escapeCell).join(','));

    // Add data rows
    data.forEach((row) => {
      const cells = headers.map((header) => escapeCell(row[header]));
      csvRows.push(cells.join(','));
    });

    // Add UTF-8 BOM to ensure Excel recognizes encoding
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${fileName}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant='outlined'
      size='small'
      onClick={handleExport}
      sx={{
        textTransform: 'none',
        px: 2,
        py: 0.75,
        fontSize: '0.875rem',
        color: '#000000',
        borderColor: '#cccccc',
        '&:hover': {
          borderColor: '#999999',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      导出数据
    </Button>
  );
};

export default ExportButton;
