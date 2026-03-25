'use client';

/**
 * RAGFlow 功能主页面
 * 放置路径：frontend/app/(main)/ragflow/page.tsx
 * Tab 结构：
 *   0 - 知识库管理
 *   1 - 文档管理
 *   2 - 助手管理（列表 / 新建 / 编辑 / 删除）
 *   3 - 会话管理（选定助手后列出会话 / 新建 / 重命名 / 删除）
 *   4 - 智能对话（选定助手+会话后进入对话）
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormHelperText,
  Skeleton,
  Badge,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  createTheme,
  ThemeProvider,
  CssBaseline,
  alpha,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Description as DocIcon,
  SmartToy as BotIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  PlayArrow as ParseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  ClearAll as ClearIcon,
  FolderOpen as FolderIcon,
  CheckCircle as DoneIcon,
  Error as FailIcon,
  HourglassEmpty as UnstartIcon,
  Sync as RunningIcon,
  Cancel as CancelIcon,
  FormatQuote as QuoteIcon,
  ContentCopy as CopyIcon,
  AutoAwesome as AiIcon,
  Forum as SessionIcon,
  Search as SearchIcon,
  ArrowForward as GoIcon,
  Psychology as BrainIcon,
} from '@mui/icons-material';

import {
  ChunkMethod,
  Permission,
  DocumentStatus,
  DatasetInfo,
  DocumentInfo,
  ChatAssistantInfo,
  SessionInfo,
  ChatMessage,
  CreateDatasetRequest,
  CreateChatAssistantRequest,
  UpdateChatAssistantRequest,
  LLMConfig,
  PromptConfig,
  ChunkReference,
  ChatReference,
} from '@/types/ragflow';

import {
  listDatasets,
  createDataset,
  listDocuments,
  uploadDocuments,
  parseDocuments,
  deleteDocuments,
  getDocumentStatus,
  extractDatasets,
  extractDocuments,
  getDocumentRunStatus,
  listChatAssistants,
  createChatAssistant,
  updateChatAssistant,
  deleteChatAssistants,
  extractAssistants,
  listSessions,
  createSession,
  updateSession,
  deleteSessions,
  extractSessions,
  streamChat,
} from '@/lib/api/ragflow-api';

// ==================== 主题系统 ====================

const luxuryTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A2744',      // 深海蓝
      light: '#2D3F6B',
      dark: '#0F1A2E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#C4963A',      // 暖金
      light: '#D4AA5A',
      dark: '#A07828',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F4F0',   // 暖米白
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2744',
      secondary: '#6B7A9A',
    },
    divider: 'rgba(26,39,68,0.08)',
    success: { main: '#2E7D52', light: '#EBF5EE' },
    warning: { main: '#C4963A', light: '#FDF6E3' },
    error: { main: '#C0392B', light: '#FDECEA' },
  },
  typography: {
    fontFamily: '"DM Sans", "Noto Sans SC", system-ui, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 650, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 500 },
    body1: { lineHeight: 1.75 },
    body2: { lineHeight: 1.65 },
    caption: { letterSpacing: '0.02em' },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 3px rgba(26,39,68,0.06), 0 1px 2px rgba(26,39,68,0.04)',
    '0 2px 8px rgba(26,39,68,0.08), 0 1px 3px rgba(26,39,68,0.04)',
    '0 4px 16px rgba(26,39,68,0.10), 0 2px 6px rgba(26,39,68,0.06)',
    '0 8px 24px rgba(26,39,68,0.12), 0 4px 8px rgba(26,39,68,0.06)',
    '0 12px 32px rgba(26,39,68,0.14)',
    ...Array(19).fill('none'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 18px',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(26,39,68,0.18)',
          '&:hover': { boxShadow: '0 4px 16px rgba(26,39,68,0.24)' },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #B08530 0%, #C4963A 100%)' },
        },
        outlined: {
          borderColor: 'rgba(26,39,68,0.2)',
          '&:hover': { borderColor: '#1A2744', background: 'rgba(26,39,68,0.03)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
          '&:hover': { background: 'rgba(26,39,68,0.06)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(26,39,68,0.4)',
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(26,39,68,0.08)',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1A2744', borderWidth: 1.5 },
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(26,39,68,0.10)',
          borderRadius: '10px !important',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-expanded': { borderRadius: '10px 10px 0 0' },
          minHeight: 48,
          '& .MuiAccordionSummary-content': { margin: '12px 0' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(26,39,68,0.18)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          padding: '20px 24px 12px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: '0.72rem' },
        sizeSmall: { height: 22 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(26,39,68,0.06)', padding: '10px 14px' },
        head: {
          fontWeight: 650,
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6B7A9A',
          background: 'rgba(26,39,68,0.025)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background 0.12s ease',
          '&.MuiTableRow-hover:hover': { background: 'rgba(26,39,68,0.03)' },
          '&.Mui-selected': { background: 'rgba(26,39,68,0.05) !important' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 5 },
        bar: { borderRadius: 4 },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: { '& .MuiAlert-root': { borderRadius: 10 } },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8, transform: 'none' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          background: '#1A2744',
          padding: '5px 10px',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#1A2744' },
        thumb: {
          '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 8px rgba(26,39,68,0.10)' },
        },
        track: { height: 4, borderRadius: 4 },
        rail: { height: 4, borderRadius: 4, opacity: 0.15 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': { color: '#1A2744' },
          '&.MuiCheckbox-indeterminate': { color: '#1A2744' },
        },
      },
    },
  },
});

// ==================== 设计 Token ====================

const DT = {
  cardBg: 'rgba(255,255,255,0.92)',
  cardBorder: 'rgba(26,39,68,0.08)',
  headerGradient: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
  goldAccent: '#C4963A',
  tabBg: 'rgba(26,39,68,0.03)',
  hoverGlow: '0 4px 20px rgba(26,39,68,0.12)',
  glassCard: {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(26,39,68,0.08)',
  },
};

// ==================== 工具函数 ====================

function uid(): string { return Math.random().toString(36).slice(2, 10); }

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

// ==================== 状态配置 ====================

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }> = {
  [DocumentStatus.DONE]: { label: '已完成', color: 'success', icon: <DoneIcon sx={{ fontSize: 13 }} /> },
  [DocumentStatus.RUNNING]: { label: '解析中', color: 'warning', icon: <RunningIcon sx={{ fontSize: 13 }} /> },
  [DocumentStatus.FAIL]: { label: '失败', color: 'error', icon: <FailIcon sx={{ fontSize: 13 }} /> },
  [DocumentStatus.UNSTART]: { label: '未开始', color: 'default', icon: <UnstartIcon sx={{ fontSize: 13 }} /> },
  [DocumentStatus.CANCEL]: { label: '已取消', color: 'default', icon: <CancelIcon sx={{ fontSize: 13 }} /> },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'default' as const, icon: null };
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: '#EBF5EE', text: '#2E7D52', border: 'rgba(46,125,82,0.2)' },
    warning: { bg: '#FDF6E3', text: '#C4963A', border: 'rgba(196,150,58,0.25)' },
    error:   { bg: '#FDECEA', text: '#C0392B', border: 'rgba(192,57,43,0.2)' },
    default: { bg: 'rgba(26,39,68,0.05)', text: '#6B7A9A', border: 'rgba(26,39,68,0.12)' },
  };
  const c = colorMap[cfg.color] ?? colorMap.default;
  return (
    <Chip
      size="small"
      label={cfg.label}
      icon={cfg.icon as React.ReactElement}
      sx={{
        fontWeight: 650, fontSize: '0.71rem', height: 22,
        background: c.bg, color: c.text,
        border: `1px solid ${c.border}`,
        '& .MuiChip-icon': { color: c.text },
      }}
    />
  );
}

const CHUNK_LABELS: Record<string, string> = {
  naive: '通用', book: '书籍', email: '邮件', laws: '法规',
  manual: '手册', one: '单块', paper: '论文', picture: '图片',
  presentation: '演示', qa: '问答', table: '表格', tag: '标签',
};

// ==================== Toast Hook ====================

function useToast() {
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const show = useCallback((msg: string, severity: 'success' | 'error' | 'info' = 'info') => setToast({ msg, severity }), []);
  const close = useCallback(() => setToast(null), []);
  return { toast, show, close };
}

// ==================== 共用 UI 原语 ====================

/** 统一区块标题栏 */
function SectionHeader({
  title, subtitle, children,
}: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, gap: 1.5, flexWrap: 'wrap' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.01em' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

/** 空状态占位 */
function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return (
    <Box sx={{
      textAlign: 'center', py: 10, color: 'text.secondary',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(26,39,68,0.04)',
        border: '1px solid rgba(26,39,68,0.08)',
        mb: 0.5,
        '& svg': { fontSize: 32, opacity: 0.35, color: 'text.secondary' },
      }}>
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{text}</Typography>
      {action}
    </Box>
  );
}

/** 带动效的主按钮 */
function PrimaryButton({ startIcon, onClick, disabled, loading, children, color = 'primary' }: {
  startIcon?: React.ReactNode; onClick?: () => void; disabled?: boolean;
  loading?: boolean; children: React.ReactNode; color?: 'primary' | 'secondary';
}) {
  return (
    <Button
      variant="contained"
      color={color}
      startIcon={loading ? <CircularProgress size={15} color="inherit" /> : startIcon}
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        borderRadius: 2,
        background: color === 'secondary'
          ? 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)'
          : 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
        boxShadow: '0 2px 10px rgba(26,39,68,0.2)',
        '&:hover': { boxShadow: '0 4px 18px rgba(26,39,68,0.28)' },
        '&.Mui-disabled': { opacity: 0.45 },
      }}
    >
      {children}
    </Button>
  );
}

/** 幽灵图标按钮 */
function GhostIconButton({ icon, title, onClick, color = 'default', size = 'small' }: {
  icon: React.ReactNode; title?: string; onClick: () => void;
  color?: 'default' | 'error' | 'primary'; size?: 'small' | 'medium';
}) {
  const colorStyle = color === 'error'
    ? { '&:hover': { background: 'rgba(192,57,43,0.08)', color: '#C0392B' } }
    : color === 'primary'
    ? { '&:hover': { background: 'rgba(26,39,68,0.08)', color: '#1A2744' } }
    : {};
  const btn = (
    <IconButton size={size} onClick={onClick} sx={{ borderRadius: 7, ...colorStyle }}>
      {icon}
    </IconButton>
  );
  return title ? <Tooltip title={title}>{btn}</Tooltip> : btn;
}

// ==================== 表格容器 ====================

function StyledTableContainer({ children }: { children: React.ReactNode }) {
  return (
    <TableContainer component={Paper} elevation={0} sx={{
      ...DT.glassCard,
      borderRadius: 2,
      overflow: 'hidden',
    }}>
      {children}
    </TableContainer>
  );
}

// ==================== LLM / Prompt 表单子组件 ====================

function LLMFormSection({ llm, onChange }: { llm: LLMConfig; onChange: (partial: Partial<LLMConfig>) => void }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%',
            background: DT.goldAccent, flexShrink: 0,
          }} />
          <Typography variant="body2" fontWeight={650}>LLM 模型参数</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="模型名称" fullWidth size="small" value={llm.model_name ?? ''}
            onChange={(e) => onChange({ model_name: e.target.value })}
            placeholder="如：qwen-plus@Tongyi-Qianwen" />
          {[
            { key: 'temperature', label: '温度 Temperature', min: 0, max: 2, step: 0.05, marks: [0, 1, 2] },
            { key: 'top_p', label: 'Top-P', min: 0, max: 1, step: 0.05, marks: [0, 0.5, 1] },
            { key: 'presence_penalty', label: 'Presence Penalty', min: -2, max: 2, step: 0.1, marks: [-2, 0, 2] },
            { key: 'frequency_penalty', label: 'Frequency Penalty', min: -2, max: 2, step: 0.1, marks: [-2, 0, 2] },
          ].map(({ key, label, min, max, step, marks }) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  {(llm as any)[key] ?? 0}
                </Typography>
              </Box>
              <Slider min={min} max={max} step={step} value={(llm as any)[key] ?? 0}
                onChange={(_, v) => onChange({ [key]: v as number })}
                marks={marks.map((v) => ({ value: v, label: `${v}` }))}
              />
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function PromptFormSection({ prompt, onChange }: { prompt: PromptConfig; onChange: (partial: Partial<PromptConfig>) => void }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#2E7D52', flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={650}>Prompt 检索参数</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>相似度阈值</Typography>
              <Typography variant="caption" fontWeight={700} color="primary.main">
                {prompt.similarity_threshold ?? 0.2}
              </Typography>
            </Box>
            <Slider min={0} max={1} step={0.05} value={prompt.similarity_threshold ?? 0.2}
              onChange={(_, v) => onChange({ similarity_threshold: v as number })}
              marks={[{ value: 0, label: '0' }, { value: 0.5, label: '0.5' }, { value: 1, label: '1' }]} />
          </Box>
          <TextField label="Top N 块数" type="number" size="small" value={prompt.top_n ?? 6}
            onChange={(e) => onChange({ top_n: Number(e.target.value) })}
            inputProps={{ min: 1, max: 30 }} />
          <TextField label="开场白" fullWidth multiline rows={2} size="small"
            value={prompt.opener ?? ''}
            onChange={(e) => onChange({ opener: e.target.value })} />
          <TextField label="无结果时的回复" fullWidth size="small" value={prompt.empty_response ?? ''}
            onChange={(e) => onChange({ empty_response: e.target.value })} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// ==================== 助手 CRUD 弹窗 ====================

interface AssistantFormDialogProps {
  open: boolean; onClose: () => void;
  onSubmit: (data: CreateChatAssistantRequest) => Promise<void>;
  datasets: DatasetInfo[]; initialData?: ChatAssistantInfo; title: string;
}

function AssistantFormDialog({ open, onClose, onSubmit, datasets, initialData, title }: AssistantFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateChatAssistantRequest>({
    name: '', dataset_ids: [],
    llm: { model_name: '', temperature: 0.1, top_p: 0.3, presence_penalty: 0.4, frequency_penalty: 0.7 },
    prompt: { similarity_threshold: 0.2, top_n: 6, opener: '您好！我是您的 AI 助手，有什么可以帮助您？', show_quote: true },
  });

  useEffect(() => {
    if (open && initialData) {
      setForm({ name: initialData.name, dataset_ids: initialData.dataset_ids ?? [],
        llm: (initialData.llm as LLMConfig) ?? form.llm,
        prompt: (initialData.prompt as PromptConfig) ?? form.prompt });
    } else if (open && !initialData) {
      setForm({ name: '', dataset_ids: [],
        llm: { model_name: '', temperature: 0.1, top_p: 0.3, presence_penalty: 0.4, frequency_penalty: 0.7 },
        prompt: { similarity_threshold: 0.2, top_n: 6, opener: '您好！我是您的 AI 助手，有什么可以帮助您？', show_quote: true } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const nameError = !form.name.trim();
  const datasetError = !form.dataset_ids || form.dataset_ids.length === 0;

  const handleSubmit = async () => {
    if (nameError || datasetError) return;
    setSubmitting(true);
    try { await onSubmit(form); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        borderBottom: '1px solid rgba(26,39,68,0.07)',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 2,
          background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BotIcon sx={{ color: 'white', fontSize: 17 }} />
        </Box>
        {title}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
        <TextField label="助手名称 *" fullWidth size="small" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={nameError} helperText={nameError ? '名称不能为空' : ''} />
        <FormControl fullWidth size="small" error={datasetError}>
          <InputLabel>关联知识库 *（至少 1 个）</InputLabel>
          <Select multiple value={form.dataset_ids ?? []}
            label="关联知识库 *（至少 1 个）"
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, dataset_ids: typeof val === 'string' ? val.split(',') : (val as string[]) });
            }}
            renderValue={(sel) =>
              (sel as string[]).map((id) => datasets.find((d) => d.id === id)?.name ?? id).join(', ')
            }>
            {datasets.length === 0
              ? <MenuItem disabled>暂无知识库，请先创建</MenuItem>
              : datasets.map((ds) => (
                <MenuItem key={ds.id} value={ds.id}>
                  <Checkbox size="small" checked={(form.dataset_ids ?? []).includes(ds.id)} />
                  <Typography variant="body2" sx={{ ml: 0.5 }}>{ds.name}</Typography>
                </MenuItem>
              ))}
          </Select>
          <FormHelperText>
            {datasetError ? '请至少选择 1 个知识库' : `已选 ${(form.dataset_ids ?? []).length} 个`}
          </FormHelperText>
        </FormControl>
        <LLMFormSection llm={form.llm ?? {}}
          onChange={(p) => setForm((prev) => ({ ...prev, llm: { ...prev.llm, ...p } }))} />
        <PromptFormSection prompt={form.prompt ?? {}}
          onChange={(p) => setForm((prev) => ({ ...prev, prompt: { ...prev.prompt, ...p } }))} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>取消</Button>
        <PrimaryButton onClick={handleSubmit} loading={submitting} disabled={nameError || datasetError}>
          确认
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  );
}

// ==================== 知识库管理模块 ====================

function DatasetPanel({ datasets, loading, onRefresh, onSelectDataset, selectedDatasetId }: {
  datasets: DatasetInfo[]; loading: boolean; onRefresh: () => void;
  onSelectDataset: (id: string) => void; selectedDatasetId: string | null;
}) {
  const { toast, show, close } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateDatasetRequest>({
    name: '', description: '', chunk_method: ChunkMethod.NAIVE, permission: Permission.ME,
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await createDataset(form);
      show('知识库创建成功', 'success');
      setCreateOpen(false);
      setForm({ name: '', description: '', chunk_method: ChunkMethod.NAIVE, permission: Permission.ME });
      onRefresh();
    } catch (e) {
      show(e instanceof Error ? e.message : '创建失败', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <Box>
      <SectionHeader title="知识库" subtitle={`共 ${datasets.length} 个`}>
        <GhostIconButton icon={<RefreshIcon fontSize="small" />} title="刷新" onClick={onRefresh} />
        <PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新增知识库</PrimaryButton>
      </SectionHeader>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={56} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : datasets.length === 0 ? (
        <EmptyState icon={<StorageIcon />} text="暂无知识库，点击右上角新增"
          action={<PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新增知识库</PrimaryButton>} />
      ) : (
        <StyledTableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>分块方式</TableCell>
                <TableCell>文档数</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.map((ds) => (
                <TableRow key={ds.id} hover selected={ds.id === selectedDatasetId}
                  sx={{ cursor: 'pointer' }} onClick={() => onSelectDataset(ds.id)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 30, height: 30, borderRadius: 1.5,
                        background: ds.id === selectedDatasetId
                          ? 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)'
                          : 'rgba(26,39,68,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <FolderIcon sx={{
                          fontSize: 16,
                          color: ds.id === selectedDatasetId ? 'white' : 'text.secondary',
                        }} />
                      </Box>
                      <Typography variant="body2" fontWeight={650}>{ds.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      {ds.description ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={CHUNK_LABELS[ds.chunk_method] ?? ds.chunk_method} size="small"
                      sx={{ background: 'rgba(26,39,68,0.05)', color: 'text.secondary', border: '1px solid rgba(26,39,68,0.1)' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{ds.document_count}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{formatDate(ds.update_date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined"
                      sx={{ borderColor: 'rgba(26,39,68,0.15)', color: 'text.primary', borderRadius: 1.5 }}
                      onClick={(e) => { e.stopPropagation(); onSelectDataset(ds.id); }}>
                      查看文档
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>新增知识库</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important' }}>
          <TextField label="知识库名称 *" fullWidth size="small" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!form.name.trim()} helperText={!form.name.trim() ? '名称不能为空' : ''} />
          <TextField label="描述" fullWidth multiline rows={2} size="small"
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormControl fullWidth size="small">
            <InputLabel>分块方法</InputLabel>
            <Select value={form.chunk_method ?? ChunkMethod.NAIVE} label="分块方法"
              onChange={(e) => setForm({ ...form, chunk_method: e.target.value as ChunkMethod })}>
              {Object.entries(CHUNK_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>访问权限</InputLabel>
            <Select value={form.permission ?? Permission.ME} label="访问权限"
              onChange={(e) => setForm({ ...form, permission: e.target.value as Permission })}>
              <MenuItem value={Permission.ME}>仅自己</MenuItem>
              <MenuItem value={Permission.TEAM}>团队</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: 'text.secondary' }}>取消</Button>
          <PrimaryButton onClick={handleCreate} loading={submitting} disabled={!form.name.trim()}>
            创建
          </PrimaryButton>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 文档管理模块 ====================

function DocumentPanel({ datasetId, datasetName }: { datasetId: string; datasetName: string }) {
  const { toast, show, close } = useToast();
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listDocuments(datasetId, 1, 50, statusFilter || undefined);
      setDocs(extractDocuments(resp));
    } catch (e) { show(e instanceof Error ? e.message : '加载文档失败', 'error'); }
    finally { setLoading(false); }
  }, [datasetId, statusFilter, show]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    const hasRunning = docs.some((d) => getDocumentRunStatus(d) === DocumentStatus.RUNNING);
    if (hasRunning) {
      pollingRef.current = setInterval(async () => {
        const updated = await Promise.all(docs.map(async (doc) => {
          if (getDocumentRunStatus(doc) !== DocumentStatus.RUNNING) return doc;
          try {
            const r = await getDocumentStatus(datasetId, doc.id);
            return { ...doc, run: r.data?.status ?? getDocumentRunStatus(doc) };
          } catch { return doc; }
        }));
        setDocs(updated);
      }, 3000);
    } else {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [docs, datasetId]);

  const handleUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const allowed = ['pdf', 'txt', 'md'];
    const invalid = fileArr.filter((f) => !allowed.includes(f.name.split('.').pop()?.toLowerCase() ?? ''));
    if (invalid.length > 0) { show(`不支持的格式：${invalid.map((f) => f.name).join(', ')}`, 'error'); return; }
    setUploadProgress(0);
    try {
      await uploadDocuments(datasetId, fileArr, setUploadProgress);
      show('上传成功', 'success'); fetchDocs();
    } catch (e) { show(e instanceof Error ? e.message : '上传失败', 'error'); }
    finally { setUploadProgress(null); }
  };

  const handleParse = async (ids?: string[]) => {
    const targetIds = ids ?? selected;
    if (!targetIds.length) return;
    try {
      await parseDocuments(datasetId, { document_ids: targetIds });
      show('已提交解析任务', 'success');
      setTimeout(fetchDocs, 1500);
    } catch (e) { show(e instanceof Error ? e.message : '提交解析失败', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await deleteDocuments(datasetId, selected.length > 0 ? selected : undefined);
      show('删除成功', 'success');
      setSelected([]); setDeleteConfirm(false); fetchDocs();
    } catch (e) { show(e instanceof Error ? e.message : '删除失败', 'error'); }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = docs.length > 0 && selected.length === docs.length;

  return (
    <Box>
      <SectionHeader title="文档管理" subtitle={`知识库：${datasetName}`}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.8rem' }}>状态过滤</InputLabel>
          <Select value={statusFilter} label="状态过滤" sx={{ borderRadius: 1.5 }}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">全部</MenuItem>
            {Object.values(DocumentStatus).map((s) => (
              <MenuItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <GhostIconButton icon={<RefreshIcon fontSize="small" />} title="刷新" onClick={fetchDocs} />
        {selected.length > 0 && (
          <>
            <Button size="small" variant="outlined" startIcon={<ParseIcon sx={{ fontSize: 16 }} />}
              onClick={() => handleParse()}
              sx={{ borderRadius: 1.5, borderColor: 'rgba(26,39,68,0.15)', color: 'text.primary' }}>
              解析 ({selected.length})
            </Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
              onClick={() => setDeleteConfirm(true)} sx={{ borderRadius: 1.5 }}>
              删除 ({selected.length})
            </Button>
          </>
        )}
        <PrimaryButton startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
          上传文档
        </PrimaryButton>
      </SectionHeader>

      {/* 上传进度 */}
      {uploadProgress !== null && (
        <Box sx={{ mb: 2, p: 2, borderRadius: 2, background: 'rgba(26,39,68,0.04)', border: '1px solid rgba(26,39,68,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">上传中…</Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">{uploadProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* 拖拽上传区 */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '1.5px dashed',
          borderColor: dragOver ? '#C4963A' : 'rgba(26,39,68,0.15)',
          borderRadius: 2.5, p: 3, mb: 2.5, textAlign: 'center',
          bgcolor: dragOver ? 'rgba(196,150,58,0.05)' : 'rgba(26,39,68,0.018)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'rgba(26,39,68,0.3)',
            bgcolor: 'rgba(26,39,68,0.03)',
          },
        }}>
        <UploadIcon sx={{ fontSize: 28, color: dragOver ? DT.goldAccent : 'rgba(26,39,68,0.25)', mb: 0.5, transition: 'color 0.2s' }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          拖拽文件到此处，或点击选择上传
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          支持 PDF · TXT · Markdown
        </Typography>
      </Box>

      <input ref={fileInputRef} type="file" hidden multiple accept=".pdf,.txt,.md"
        onChange={(e) => e.target.files && handleUpload(e.target.files)} />

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={50} sx={{ borderRadius: 1.5 }} />)}
        </Box>
      ) : docs.length === 0 ? (
        <EmptyState icon={<DocIcon />} text="暂无文档，请上传文件" />
      ) : (
        <StyledTableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={(e) => setSelected(e.target.checked ? docs.map((d) => d.id) : [])} />
                </TableCell>
                <TableCell>文件名</TableCell>
                <TableCell>大小</TableCell>
                <TableCell>解析状态</TableCell>
                <TableCell>上传时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => {
                const runStatus = getDocumentRunStatus(doc);
                return (
                  <TableRow key={doc.id} hover selected={selected.includes(doc.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.includes(doc.id)} onChange={() => toggleSelect(doc.id)} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                        <Typography variant="body2" fontWeight={500}>{doc.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{formatBytes(doc.size)}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={runStatus} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{formatDate(doc.create_date)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {(runStatus === DocumentStatus.UNSTART || runStatus === DocumentStatus.FAIL) && (
                          <GhostIconButton icon={<ParseIcon sx={{ fontSize: 16 }} />} title="解析此文档"
                            color="primary" onClick={() => handleParse([doc.id])} />
                        )}
                        <GhostIconButton icon={<DeleteIcon sx={{ fontSize: 16 }} />} title="删除"
                          color="error" onClick={() => { setSelected([doc.id]); setDeleteConfirm(true); }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </StyledTableContainer>
      )}

      {/* 删除确认 */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>确认删除</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            确定要删除选中的 <strong>{selected.length}</strong> 个文档吗？此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ borderRadius: 2, boxShadow: 'none' }}>确认删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 助手管理模块 ====================

function AssistantManagerPanel({ datasets, onSelectAssistant, selectedAssistantId }: {
  datasets: DatasetInfo[]; onSelectAssistant: (assistant: ChatAssistantInfo) => void;
  selectedAssistantId: string | null;
}) {
  const { toast, show, close } = useToast();
  const [assistants, setAssistants] = useState<ChatAssistantInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChatAssistantInfo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatAssistantInfo | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchAssistants = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listChatAssistants({ page: 1, page_size: 50, name: searchName || undefined });
      setAssistants(extractAssistants(resp));
    } catch (e) { show(e instanceof Error ? e.message : '加载助手列表失败', 'error'); }
    finally { setLoading(false); }
  }, [searchName, show]);

  useEffect(() => { fetchAssistants(); }, [fetchAssistants]);

  const handleCreate = async (data: CreateChatAssistantRequest) => {
    try {
      await createChatAssistant(data);
      show('聊天助手创建成功', 'success'); setCreateOpen(false); fetchAssistants();
    } catch (e) { show(e instanceof Error ? e.message : '创建失败', 'error'); throw e; }
  };

  const handleUpdate = async (data: CreateChatAssistantRequest) => {
    if (!editTarget) return;
    try {
      await updateChatAssistant(editTarget.id, { name: data.name, dataset_ids: data.dataset_ids, llm: data.llm, prompt: data.prompt });
      show('更新成功', 'success'); setEditTarget(null); fetchAssistants();
    } catch (e) { show(e instanceof Error ? e.message : '更新失败', 'error'); throw e; }
  };

  const confirmDelete = async () => {
    try {
      await deleteChatAssistants({ ids: selectedIds });
      show(`已删除 ${selectedIds.length} 个助手`, 'success');
      setSelectedIds([]); setDeleteTarget(null); setDeleteConfirm(false); fetchAssistants();
    } catch (e) { show(e instanceof Error ? e.message : '删除失败', 'error'); }
  };

  const toggleSelectId = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = assistants.length > 0 && selectedIds.length === assistants.length;

  return (
    <Box>
      <SectionHeader title="聊天助手" subtitle={`共 ${assistants.length} 个`}>
        <TextField size="small" placeholder="搜索助手…" value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ width: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <GhostIconButton icon={<RefreshIcon fontSize="small" />} title="刷新" onClick={fetchAssistants} />
        {selectedIds.length > 0 && (
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={() => setDeleteConfirm(true)} sx={{ borderRadius: 1.5 }}>
            删除 ({selectedIds.length})
          </Button>
        )}
        <PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新建助手</PrimaryButton>
      </SectionHeader>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={112} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : assistants.length === 0 ? (
        <EmptyState icon={<BotIcon />} text="暂无聊天助手，点击右上角新建"
          action={<PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新建助手</PrimaryButton>} />
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5, mb: 1 }}>
            <Checkbox size="small" checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              onChange={(e) => setSelectedIds(e.target.checked ? assistants.map((a) => a.id) : [])} />
            <Typography variant="caption" color="text.secondary">全选</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1.5 }}>
            {assistants.map((assistant) => {
              const isActive = assistant.id === selectedAssistantId;
              const isSelected = selectedIds.includes(assistant.id);
              return (
                <Card key={assistant.id} elevation={0} sx={{
                  ...DT.glassCard,
                  borderRadius: 2.5,
                  borderColor: isActive ? DT.goldAccent : isSelected ? 'rgba(26,39,68,0.2)' : 'rgba(26,39,68,0.08)',
                  borderWidth: isActive ? 1.5 : 1,
                  transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
                  '&:hover': { boxShadow: DT.hoverGlow, transform: 'translateY(-1px)' },
                  position: 'relative',
                  overflow: 'visible',
                }}>
                  {isActive && (
                    <Box sx={{
                      position: 'absolute', top: -1, left: 16,
                      background: DT.goldAccent, color: 'white',
                      borderRadius: '0 0 6px 6px', px: 1.5, py: 0.25,
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
                    }}>当前</Box>
                  )}
                  <CardContent sx={{ pb: '8px !important', pt: isActive ? 2.5 : 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox size="small" checked={isSelected}
                        onChange={() => toggleSelectId(assistant.id)}
                        onClick={(e) => e.stopPropagation()} sx={{ mt: -0.5, ml: -0.5 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: 2,
                            background: isActive
                              ? 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)'
                              : 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <BotIcon sx={{ color: 'white', fontSize: 18 }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{assistant.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {assistant.dataset_ids.length} 个知识库
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                          更新 {formatDate(assistant.update_date)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 0, px: 1.5, pb: 1.5, gap: 0.5 }}>
                    <Button size="small" variant="contained" endIcon={<SessionIcon sx={{ fontSize: 14 }} />}
                      onClick={() => onSelectAssistant(assistant)}
                      sx={{
                        borderRadius: 1.5, fontSize: '0.76rem', py: 0.6,
                        background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
                        boxShadow: '0 2px 6px rgba(26,39,68,0.2)',
                      }}>
                      进入会话
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <GhostIconButton icon={<EditIcon sx={{ fontSize: 16 }} />} title="编辑助手"
                      onClick={() => setEditTarget(assistant)} />
                    <GhostIconButton icon={<DeleteIcon sx={{ fontSize: 16 }} />} title="删除助手"
                      color="error" onClick={() => { setDeleteTarget(assistant); setSelectedIds([assistant.id]); setDeleteConfirm(true); }} />
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      <AssistantFormDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate} datasets={datasets} title="新建聊天助手" />
      <AssistantFormDialog open={!!editTarget} onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate} datasets={datasets} initialData={editTarget ?? undefined} title="编辑聊天助手" />

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>确认删除</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>
            {deleteTarget ? `确定删除助手「${deleteTarget.name}」吗？` : `确定删除选中的 ${selectedIds.length} 个助手吗？`}
            <br />此操作不可恢复，关联的会话也将一并删除。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>取消</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}
            sx={{ borderRadius: 2, boxShadow: 'none' }}>确认删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 会话管理模块 ====================

function SessionManagerPanel({ assistant, onEnterChat }: {
  assistant: ChatAssistantInfo; onEnterChat: (session: SessionInfo) => void;
}) {
  const { toast, show, close } = useToast();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [renameTarget, setRenameTarget] = useState<SessionInfo | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listSessions(assistant.id, { page: 1, page_size: 50 });
      setSessions(extractSessions(resp));
    } catch (e) { show(e instanceof Error ? e.message : '加载会话列表失败', 'error'); }
    finally { setLoading(false); }
  }, [assistant.id, show]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createSession(assistant.id, newSessionName.trim() || undefined);
      show('会话创建成功', 'success'); setCreateOpen(false); setNewSessionName(''); fetchSessions();
    } catch (e) { show(e instanceof Error ? e.message : '创建失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setSubmitting(true);
    try {
      await updateSession(assistant.id, renameTarget.id, { name: renameValue.trim() });
      show('重命名成功', 'success'); setRenameTarget(null); fetchSessions();
    } catch (e) { show(e instanceof Error ? e.message : '重命名失败', 'error'); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    try {
      await deleteSessions(assistant.id, { ids: deleteIds });
      show(`已删除 ${deleteIds.length} 个会话`, 'success');
      setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
      setDeleteIds([]); setDeleteConfirm(false); fetchSessions();
    } catch (e) { show(e instanceof Error ? e.message : '删除失败', 'error'); }
  };

  const toggleSelectId = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = sessions.length > 0 && selectedIds.length === sessions.length;

  return (
    <Box>
      <SectionHeader title={`${assistant.name}`} subtitle="会话列表">
        <GhostIconButton icon={<RefreshIcon fontSize="small" />} title="刷新" onClick={fetchSessions} />
        {selectedIds.length > 0 && (
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            onClick={() => { setDeleteIds(selectedIds); setDeleteConfirm(true); }} sx={{ borderRadius: 1.5 }}>
            删除 ({selectedIds.length})
          </Button>
        )}
        <PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新建会话</PrimaryButton>
      </SectionHeader>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height={52} sx={{ borderRadius: 1.5 }} />)}
        </Box>
      ) : sessions.length === 0 ? (
        <EmptyState icon={<SessionIcon />} text="暂无会话，点击右上角新建"
          action={<PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>新建会话</PrimaryButton>} />
      ) : (
        <StyledTableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox size="small" checked={allSelected}
                    indeterminate={selectedIds.length > 0 && !allSelected}
                    onChange={(e) => setSelectedIds(e.target.checked ? sessions.map((s) => s.id) : [])} />
                </TableCell>
                <TableCell>会话名称</TableCell>
                <TableCell>消息数</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>更新时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selectedIds.includes(session.id)}
                      onChange={() => toggleSelectId(session.id)} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="body2" fontWeight={500}>{session.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={`${session.messages?.length ?? 0} 条`}
                      sx={{ background: 'rgba(26,39,68,0.05)', color: 'text.secondary', border: '1px solid rgba(26,39,68,0.1)' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{formatDate(session.create_date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{formatDate(session.update_date)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <GhostIconButton icon={<GoIcon sx={{ fontSize: 16 }} />} title="进入对话"
                        color="primary" onClick={() => onEnterChat(session)} />
                      <GhostIconButton icon={<EditIcon sx={{ fontSize: 16 }} />} title="重命名"
                        onClick={() => { setRenameTarget(session); setRenameValue(session.name); }} />
                      <GhostIconButton icon={<DeleteIcon sx={{ fontSize: 16 }} />} title="删除"
                        color="error" onClick={() => { setDeleteIds([session.id]); setDeleteConfirm(true); }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>新建会话</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField autoFocus fullWidth size="small" label="会话名称（选填）"
            value={newSessionName} onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="不填则自动命名" sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: 'text.secondary' }}>取消</Button>
          <PrimaryButton onClick={handleCreate} loading={submitting}>创建</PrimaryButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>重命名会话</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField autoFocus fullWidth size="small" label="新名称 *" value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={!renameValue.trim()} sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setRenameTarget(null)} sx={{ color: 'text.secondary' }}>取消</Button>
          <PrimaryButton onClick={handleRename} loading={submitting} disabled={!renameValue.trim()}>确认</PrimaryButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid rgba(26,39,68,0.07)' }}>确认删除</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <DialogContentText>确定要删除选中的 <strong>{deleteIds.length}</strong> 个会话吗？此操作不可恢复。</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid rgba(26,39,68,0.07)' }}>
          <Button onClick={() => setDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>取消</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}
            sx={{ borderRadius: 2, boxShadow: 'none' }}>确认删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 引用溯源组件 ====================

function ReferenceBlock({ reference }: { reference: ChatReference | Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const chunks: ChunkReference[] = Array.isArray((reference as ChatReference).chunks)
    ? (reference as ChatReference).chunks : [];
  if (chunks.length === 0) return null;

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} sx={{
      mt: 1.5, boxShadow: 'none', '&:before': { display: 'none' },
      background: 'rgba(26,39,68,0.025)',
      border: '1px solid rgba(26,39,68,0.08)',
      borderRadius: '10px !important',
    }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 36, py: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <QuoteIcon sx={{ fontSize: 14, color: DT.goldAccent }} />
          <Typography variant="caption" fontWeight={650} sx={{ color: DT.goldAccent }}>
            引用溯源（{chunks.length} 处）
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0.5, pb: 1.5 }}>
        {chunks.map((chunk, i) => (
          <Box key={chunk.id ?? i} sx={{
            mb: 1, p: 1.5, borderRadius: 1.5,
            background: 'white',
            border: '1px solid rgba(26,39,68,0.07)',
            borderLeft: `3px solid ${DT.goldAccent}`,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <DocIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" fontWeight={650} color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}>
                  {chunk.document_name}
                </Typography>
              </Box>
              <Chip size="small" label={`${(chunk.similarity * 100).toFixed(0)}%`}
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
                  background: 'rgba(196,150,58,0.12)', color: DT.goldAccent,
                  border: '1px solid rgba(196,150,58,0.2)' }} />
            </Box>
            <Typography variant="body2" color="text.secondary"
              sx={{ lineHeight: 1.6, fontSize: '0.8rem' }}>
              {chunk.content}
            </Typography>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

// ==================== 智能对话模块 ====================

function ChatPanel({ assistant, session }: { assistant: ChatAssistantInfo; session: SessionInfo }) {
  const { toast, show, close } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>(session.id);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages([]); setSessionId(session.id); }, [session.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;
    setInput(''); setIsLoading(true);
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: question, timestamp: Date.now() };
    const aId = uid();
    const assistantMsg: ChatMessage = { id: aId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    await streamChat(
      assistant.id,
      { question, stream: true, session_id: sessionId },
      (data) => {
        if (data.session_id) setSessionId(data.session_id);
        setMessages((prev) => prev.map((m) =>
          m.id === aId ? { ...m, content: data.answer ?? m.content, reference: data.reference ?? m.reference } : m));
      },
      () => {
        setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, isStreaming: false } : m));
        setIsLoading(false);
      },
      (err) => {
        show(err.message, 'error');
        setMessages((prev) => prev.map((m) =>
          m.id === aId ? { ...m, content: '❌ 请求出错，请重试', isStreaming: false } : m));
        setIsLoading(false);
      },
    );
  };

  const handleExport = () => {
    const content = messages
      .map((m) => `[${m.role === 'user' ? '用户' : '助手'}] ${new Date(m.timestamp).toLocaleString('zh-CN')}\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `对话记录_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const opener = typeof assistant.prompt?.opener === 'string' ? assistant.prompt.opener : '您好！请输入您的问题';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '72vh' }}>
      {/* 对话头部 */}
      <Box sx={{
        display: 'flex', alignItems: 'center', mb: 2, gap: 1.5,
        pb: 2, borderBottom: '1px solid rgba(26,39,68,0.08)',
      }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: 2,
          background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BrainIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>{assistant.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {session.name}
            <Box component="span" sx={{ mx: 0.75, color: 'text.disabled' }}>·</Box>
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.68rem' }}>
              {sessionId.slice(0, 8)}…
            </Box>
          </Typography>
        </Box>
        {messages.length > 0 && (
          <>
            <GhostIconButton icon={<DownloadIcon sx={{ fontSize: 18 }} />} title="导出对话记录" onClick={handleExport} />
            <GhostIconButton icon={<ClearIcon sx={{ fontSize: 18 }} />} title="清空显示（不删除会话）"
              onClick={() => setMessages([])} />
          </>
        )}
      </Box>

      {/* 消息区 */}
      <Box sx={{
        flex: 1, overflowY: 'auto', borderRadius: 2,
        background: 'rgba(26,39,68,0.025)',
        border: '1px solid rgba(26,39,68,0.06)',
        p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, mb: 2,
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(26,39,68,0.12)', borderRadius: 10 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
      }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', my: 'auto', color: 'text.secondary', py: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2,
              background: 'rgba(26,39,68,0.05)',
              border: '1px solid rgba(26,39,68,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChatIcon sx={{ fontSize: 28, opacity: 0.3 }} />
            </Box>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              开始与 AI 助手对话
            </Typography>
            <Typography variant="caption" color="text.disabled">{opener}</Typography>
          </Box>
        )}

        {messages.map((msg) => (
          <Box key={msg.id} sx={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 1.5, alignItems: 'flex-start',
          }}>
            {/* 头像 */}
            <Box sx={{
              width: 32, height: 32, borderRadius: 2, flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)'
                : 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.7rem', fontWeight: 800,
              boxShadow: '0 2px 6px rgba(26,39,68,0.15)',
            }}>
              {msg.role === 'user' ? '我' : 'AI'}
            </Box>

            <Box sx={{ maxWidth: '76%' }}>
              <Paper elevation={0} sx={{
                p: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                position: 'relative',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)'
                  : 'rgba(255,255,255,0.96)',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                border: msg.role === 'assistant' ? '1px solid rgba(26,39,68,0.08)' : 'none',
                boxShadow: msg.role === 'user'
                  ? '0 3px 10px rgba(26,39,68,0.2)'
                  : '0 2px 8px rgba(26,39,68,0.06)',
              }}>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', lineHeight: 1.75,
                  '&::after': msg.isStreaming ? {
                    content: '"▋"', display: 'inline', marginLeft: '2px',
                    animation: 'blink 1s step-end infinite',
                    '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
                  } : {},
                }}>
                  {msg.content || (msg.isStreaming ? '' : '（空响应）')}
                </Typography>
                {msg.role === 'assistant' && !msg.isStreaming && (
                  <Tooltip title="复制">
                    <IconButton size="small"
                      sx={{
                        position: 'absolute', top: 4, right: 4, opacity: 0,
                        '.MuiPaper-root:hover &': { opacity: 0.5 },
                        '&:hover': { opacity: '1 !important' },
                        transition: 'opacity 0.15s',
                      }}
                      onClick={() => {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(msg.content).catch(() => {
                            const ta = document.createElement('textarea');
                            ta.value = msg.content;
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            ta.remove();
                          });
                        } else {
                          const ta = document.createElement('textarea');
                          ta.value = msg.content;
                          document.body.appendChild(ta);
                          ta.select();
                          document.execCommand('copy');
                          ta.remove();
                        }
                      }}>
                      <CopyIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Paper>
              {msg.role === 'assistant' && !msg.isStreaming && msg.reference && (
                <ReferenceBlock reference={msg.reference as ChatReference | Record<string, unknown>} />
              )}
            </Box>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* 输入区 */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
        <TextField fullWidth multiline maxRows={4}
          placeholder="输入问题… (Ctrl+Enter 发送)"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendMessage(); } }}
          disabled={isLoading} size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              background: 'white',
              borderRadius: 2.5,
              '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(26,39,68,0.08)' },
            },
          }}
        />
        <Button variant="contained"
          endIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 17 }} />}
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          sx={{
            borderRadius: 2.5, px: 2.5, height: 42, flexShrink: 0,
            background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
            boxShadow: '0 2px 10px rgba(26,39,68,0.25)',
            '&:hover': { boxShadow: '0 4px 16px rgba(26,39,68,0.32)' },
            '&.Mui-disabled': { opacity: 0.4 },
          }}>
          发送
        </Button>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 主页面 ====================

const TAB_ICONS = [
  <StorageIcon key="storage" sx={{ fontSize: 18 }} />,
  <DocIcon key="document" sx={{ fontSize: 18 }} />,
  <BotIcon key="bot" sx={{ fontSize: 18 }} />,
  <SessionIcon key="session" sx={{ fontSize: 18 }} />,
  <ChatIcon key="chat" sx={{ fontSize: 18 }} />,
];

export default function RAGFlowPage() {
  const [tab, setTab] = useState(0);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [activeAssistant, setActiveAssistant] = useState<ChatAssistantInfo | null>(null);
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);
  const { toast, show, close } = useToast();

  const fetchDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    try {
      const resp = await listDatasets(1, 50);
      setDatasets(extractDatasets(resp));
    } catch (e) { show(e instanceof Error ? e.message : '加载知识库失败', 'error'); }
    finally { setDatasetsLoading(false); }
  }, [show]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const handleSelectDataset = (id: string) => { setSelectedDatasetId(id); setTab(1); };
  const handleSelectAssistant = (assistant: ChatAssistantInfo) => { setActiveAssistant(assistant); setTab(3); };
  const handleEnterChat = (session: SessionInfo) => { setActiveSession(session); setTab(4); };

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  const TABS = [
    { label: '知识库', locked: false },
    { label: '文档管理', locked: !selectedDatasetId },
    { label: '助手管理', locked: false },
    { label: '会话管理', locked: false, badge: activeAssistant ? true : false },
    { label: '智能对话', locked: false, badge: activeSession ? true : false },
  ];

  return (
    <ThemeProvider theme={luxuryTheme}>
      <CssBaseline />

      {/* 全局字体引入 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
          background: #F5F4F0;
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tab-content-anim {
          animation: fadeSlideIn 0.22s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>

      <Box sx={{
        p: { xs: 2, md: 3.5 },
        maxWidth: 1240,
        mx: 'auto',
        minHeight: '100vh',
      }}>

        {/* ── 页面标题 ── */}
        <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #1A2744 0%, #2D3F6B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(26,39,68,0.22)',
            flexShrink: 0,
          }}>
            <AiIcon sx={{ color: 'white', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.03em', color: 'text.primary' }}>
              RAGFlow
              <Box component="span" sx={{
                ml: 1.5, fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #C4963A 0%, #D4AA5A 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                verticalAlign: 'middle',
              }}>
                智能问答
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.02em' }}>
              基于深度文档理解的检索增强生成引擎
            </Typography>
          </Box>
        </Box>

        {/* ── 上下文面包屑 ── */}
        {(activeAssistant || activeSession) && (
          <Box sx={{
            mb: 2.5,
            display: 'flex', alignItems: 'center', gap: 1,
            flexWrap: 'wrap',
          }}>
            {activeAssistant && (
              <Chip
                size="small"
                icon={<BotIcon sx={{ fontSize: '14px !important', ml: '8px' }} />}
                label={`助手：${activeAssistant.name}`}
                onDelete={() => setActiveAssistant(null)}
                sx={{
                  background: 'rgba(26,39,68,0.07)',
                  border: '1px solid rgba(26,39,68,0.12)',
                  fontWeight: 600, fontSize: '0.75rem', height: 28,
                  '& .MuiChip-deleteIcon': { fontSize: 14, color: 'text.disabled' },
                }}
              />
            )}
            {activeSession && (
              <Chip
                size="small"
                icon={<ChatIcon sx={{ fontSize: '14px !important', ml: '8px' }} />}
                label={`会话：${activeSession.name}`}
                onDelete={() => setActiveSession(null)}
                sx={{
                  background: 'rgba(196,150,58,0.1)',
                  border: '1px solid rgba(196,150,58,0.2)',
                  color: DT.goldAccent, fontWeight: 600, fontSize: '0.75rem', height: 28,
                  '& .MuiChip-deleteIcon': { fontSize: 14, color: alpha(DT.goldAccent, 0.6) },
                }}
              />
            )}
          </Box>
        )}

        {/* ── 主卡片 ── */}
        <Paper elevation={0} sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid rgba(26,39,68,0.09)',
          boxShadow: '0 4px 24px rgba(26,39,68,0.07)',
          background: 'white',
        }}>

          {/* Tab 导航栏 */}
          <Box sx={{
            background: 'rgba(26,39,68,0.025)',
            borderBottom: '1px solid rgba(26,39,68,0.08)',
          }}>
            <Tabs
              value={tab}
              onChange={(_, v: number) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              TabIndicatorProps={{
                style: {
                  background: 'linear-gradient(90deg, #1A2744, #2D3F6B)',
                  height: 2.5, borderRadius: 2,
                },
              }}
              sx={{
                minHeight: 52,
                '& .MuiTabs-root': { px: 1 },
              }}
            >
              {TABS.map((t, i) => (
                <Tab
                  key={i}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{
                        color: tab === i ? 'primary.main' : 'text.disabled',
                        display: 'flex', transition: 'color 0.15s',
                      }}>
                        {t.badge ? (
                          <Badge variant="dot" color="success"
                            sx={{ '& .MuiBadge-dot': { width: 6, height: 6, minWidth: 6 } }}>
                            {TAB_ICONS[i]}
                          </Badge>
                        ) : TAB_ICONS[i]}
                      </Box>
                      <Typography variant="body2" fontWeight={tab === i ? 700 : 500}
                        sx={{ color: tab === i ? 'primary.main' : 'text.secondary', transition: 'all 0.15s' }}>
                        {t.label}
                      </Typography>
                    </Box>
                  }
                  disableRipple
                  sx={{
                    minHeight: 52, textTransform: 'none',
                    px: 2.5, py: 0,
                    opacity: 1,
                    '&:hover': { background: 'rgba(26,39,68,0.04)' },
                    transition: 'background 0.15s',
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab 内容区 */}
          <Box sx={{ p: { xs: 2, md: 3.5 } }}>
            <Box className="tab-content-anim" key={tab}>
              {/* Tab 0: 知识库管理 */}
              {tab === 0 && (
                <DatasetPanel datasets={datasets} loading={datasetsLoading}
                  onRefresh={fetchDatasets} onSelectDataset={handleSelectDataset}
                  selectedDatasetId={selectedDatasetId} />
              )}

              {/* Tab 1: 文档管理 */}
              {tab === 1 && (
                selectedDatasetId
                  ? <DocumentPanel datasetId={selectedDatasetId} datasetName={selectedDataset?.name ?? selectedDatasetId} />
                  : (
                    <EmptyState
                      icon={<StorageIcon />}
                      text="请先在「知识库」中选择一个知识库"
                      action={
                        <Button onClick={() => setTab(0)}
                          sx={{ mt: 0.5, color: 'text.secondary', textDecoration: 'underline' }}>
                          前往选择
                        </Button>
                      }
                    />
                  )
              )}

              {/* Tab 2: 助手管理 */}
              {tab === 2 && (
                <AssistantManagerPanel datasets={datasets}
                  onSelectAssistant={handleSelectAssistant}
                  selectedAssistantId={activeAssistant?.id ?? null} />
              )}

              {/* Tab 3: 会话管理 */}
              {/* Tab 3: 会话管理 */}
              {tab === 3 && (
                activeAssistant
                  ? <SessionManagerPanel assistant={activeAssistant} onEnterChat={handleEnterChat} />
                  : (
                    <EmptyState
                      icon={<BotIcon />}
                      text="请先在「助手管理」中选择一个聊天助手"
                      action={
                        <Button onClick={() => setTab(2)}
                          sx={{ mt: 0.5, color: 'text.secondary', textDecoration: 'underline' }}>
                          前往选择
                        </Button>
                      }
                    />
                  )
              )}

              {/* Tab 4: 智能对话 */}
              {tab === 4 && (
                activeAssistant && activeSession
                  ? <ChatPanel assistant={activeAssistant} session={activeSession} />
                  : (
                    <EmptyState
                      icon={<ChatIcon />}
                      text={!activeAssistant ? '请先在「助手管理」选择助手' : '请先在「会话管理」选择或创建会话'}
                      action={
                        <Button onClick={() => setTab(activeAssistant ? 3 : 2)}
                          sx={{ mt: 0.5, color: 'text.secondary', textDecoration: 'underline' }}>
                          {!activeAssistant ? '前往助手管理' : '前往会话管理'}
                        </Button>
                      }
                    />
                  )
              )}
            </Box>
          </Box>
        </Paper>

        {/* 版权页脚 */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: '0.03em' }}>
            RAGFlow · 深度文档理解引擎
          </Typography>
        </Box>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={toast?.severity} onClose={close}
          sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(26,39,68,0.15)' }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}