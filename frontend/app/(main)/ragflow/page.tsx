'use client';

/**
 * RAGFlow 功能主页面（完整版）
 * 放置路径：frontend/app/(main)/ragflow/page.tsx
 *
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
  MoreVert as MoreIcon,
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
  // 知识库 & 文档
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
  // 助手管理（新）
  listChatAssistants,
  createChatAssistant,
  updateChatAssistant,
  deleteChatAssistants,
  extractAssistants,
  // 会话管理（新）
  listSessions,
  createSession,
  updateSession,
  deleteSessions,
  extractSessions,
  // 对话
  streamChat,
} from '@/lib/api/ragflow-api';

// ==================== 工具函数 ====================

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ==================== 状态配置 ====================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }
> = {
  [DocumentStatus.DONE]: { label: '已完成', color: 'success', icon: <DoneIcon sx={{ fontSize: 14 }} /> },
  [DocumentStatus.RUNNING]: { label: '解析中', color: 'warning', icon: <RunningIcon sx={{ fontSize: 14 }} /> },
  [DocumentStatus.FAIL]: { label: '失败', color: 'error', icon: <FailIcon sx={{ fontSize: 14 }} /> },
  [DocumentStatus.UNSTART]: { label: '未开始', color: 'default', icon: <UnstartIcon sx={{ fontSize: 14 }} /> },
  [DocumentStatus.CANCEL]: { label: '已取消', color: 'default', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
};

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'default' as const, icon: null };
  return (
    <Chip size="small" label={cfg.label} color={cfg.color}
      icon={cfg.icon as React.ReactElement} sx={{ fontWeight: 600, fontSize: 11 }} />
  );
}

const CHUNK_LABELS: Record<string, string> = {
  naive: '通用（Naive）', book: '书籍（Book）', email: '邮件（Email）',
  laws: '法规（Laws）', manual: '手册（Manual）', one: '单块（One）',
  paper: '论文（Paper）', picture: '图片（Picture）',
  presentation: '演示（Presentation）', qa: '问答（QA）',
  table: '表格（Table）', tag: '标签（Tag）',
};

// ==================== Toast Hook ====================

function useToast() {
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const show = useCallback((msg: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, severity });
  }, []);
  const close = useCallback(() => setToast(null), []);
  return { toast, show, close };
}

// ==================== LLM / Prompt 表单子组件（复用） ====================

function LLMFormSection({
  llm, onChange,
}: {
  llm: LLMConfig;
  onChange: (partial: Partial<LLMConfig>) => void;
}) {
  return (
    <Accordion variant="outlined" sx={{ borderRadius: '8px !important' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>LLM 配置（模型参数）</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="模型名称" fullWidth value={llm.model_name ?? ''}
            onChange={(e) => onChange({ model_name: e.target.value })}
            placeholder="如：qwen-plus@Tongyi-Qianwen" />
          <Box>
            <Typography variant="body2" gutterBottom>
              温度（Temperature）：{llm.temperature ?? 0.1}
            </Typography>
            <Slider min={0} max={2} step={0.05} value={llm.temperature ?? 0.1}
              onChange={(_, v) => onChange({ temperature: v as number })}
              marks={[{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }]} />
          </Box>
          <Box>
            <Typography variant="body2" gutterBottom>Top-P：{llm.top_p ?? 0.3}</Typography>
            <Slider min={0} max={1} step={0.05} value={llm.top_p ?? 0.3}
              onChange={(_, v) => onChange({ top_p: v as number })}
              marks={[{ value: 0, label: '0' }, { value: 0.5, label: '0.5' }, { value: 1, label: '1' }]} />
          </Box>
          <Box>
            <Typography variant="body2" gutterBottom>
              Presence Penalty：{llm.presence_penalty ?? 0.4}
            </Typography>
            <Slider min={-2} max={2} step={0.1} value={llm.presence_penalty ?? 0.4}
              onChange={(_, v) => onChange({ presence_penalty: v as number })}
              marks={[{ value: -2, label: '-2' }, { value: 0, label: '0' }, { value: 2, label: '2' }]} />
          </Box>
          <Box>
            <Typography variant="body2" gutterBottom>
              Frequency Penalty：{llm.frequency_penalty ?? 0.7}
            </Typography>
            <Slider min={-2} max={2} step={0.1} value={llm.frequency_penalty ?? 0.7}
              onChange={(_, v) => onChange({ frequency_penalty: v as number })}
              marks={[{ value: -2, label: '-2' }, { value: 0, label: '0' }, { value: 2, label: '2' }]} />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

function PromptFormSection({
  prompt, onChange,
}: {
  prompt: PromptConfig;
  onChange: (partial: Partial<PromptConfig>) => void;
}) {
  return (
    <Accordion variant="outlined" sx={{ borderRadius: '8px !important' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>Prompt 配置（检索参数）</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="body2" gutterBottom>
              相似度阈值：{prompt.similarity_threshold ?? 0.2}
            </Typography>
            <Slider min={0} max={1} step={0.05} value={prompt.similarity_threshold ?? 0.2}
              onChange={(_, v) => onChange({ similarity_threshold: v as number })}
              marks={[{ value: 0, label: '0' }, { value: 0.5, label: '0.5' }, { value: 1, label: '1' }]} />
          </Box>
          <TextField label="Top N 块数" type="number" value={prompt.top_n ?? 6}
            onChange={(e) => onChange({ top_n: Number(e.target.value) })}
            inputProps={{ min: 1, max: 30 }} />
          <TextField label="开场白（opener）" fullWidth multiline rows={2}
            value={prompt.opener ?? ''}
            onChange={(e) => onChange({ opener: e.target.value })} />
          <TextField label="无结果时的回复" fullWidth value={prompt.empty_response ?? ''}
            onChange={(e) => onChange({ empty_response: e.target.value })} />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

// ==================== 助手 CRUD 弹窗 ====================

interface AssistantFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChatAssistantRequest) => Promise<void>;
  datasets: DatasetInfo[];
  initialData?: ChatAssistantInfo;
  title: string;
}

function AssistantFormDialog({
  open, onClose, onSubmit, datasets, initialData, title,
}: AssistantFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateChatAssistantRequest>({
    name: '',
    dataset_ids: [],
    llm: { model_name: '', temperature: 0.1, top_p: 0.3, presence_penalty: 0.4, frequency_penalty: 0.7 },
    prompt: { similarity_threshold: 0.2, top_n: 6, opener: '您好！我是您的 AI 助手，有什么可以帮助您？', show_quote: true },
  });

  // 编辑时回填数据
  useEffect(() => {
    if (open && initialData) {
      setForm({
        name: initialData.name,
        dataset_ids: initialData.dataset_ids ?? [],
        llm: (initialData.llm as LLMConfig) ?? form.llm,
        prompt: (initialData.prompt as PromptConfig) ?? form.prompt,
      });
    } else if (open && !initialData) {
      setForm({
        name: '',
        dataset_ids: [],
        llm: { model_name: '', temperature: 0.1, top_p: 0.3, presence_penalty: 0.4, frequency_penalty: 0.7 },
        prompt: { similarity_threshold: 0.2, top_n: 6, opener: '您好！我是您的 AI 助手，有什么可以帮助您？', show_quote: true },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    if (!form.dataset_ids || form.dataset_ids.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const llm = form.llm ?? {};
  const prompt = form.prompt ?? {};
  const nameError = !form.name.trim();
  const datasetError = !form.dataset_ids || form.dataset_ids.length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        {/* 名称 */}
        <TextField label="助手名称 *" fullWidth value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={nameError} helperText={nameError ? '名称不能为空' : ''} />

        {/* 关联知识库 */}
        <FormControl fullWidth error={datasetError}>
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
                  <Checkbox checked={(form.dataset_ids ?? []).includes(ds.id)} />
                  {ds.name}
                </MenuItem>
              ))}
          </Select>
          <FormHelperText>
            {datasetError ? '请至少选择 1 个知识库' : `已选 ${(form.dataset_ids ?? []).length} 个`}
          </FormHelperText>
        </FormControl>

        {/* LLM 配置 */}
        <LLMFormSection llm={llm}
          onChange={(p) => setForm((prev) => ({ ...prev, llm: { ...prev.llm, ...p } }))} />

        {/* Prompt 配置 */}
        <PromptFormSection prompt={prompt}
          onChange={(p) => setForm((prev) => ({ ...prev, prompt: { ...prev.prompt, ...p } }))} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSubmit}
          disabled={submitting || nameError || datasetError}>
          {submitting ? <CircularProgress size={18} /> : '确认'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== 知识库管理模块 ====================

function DatasetPanel({
  datasets, loading, onRefresh, onSelectDataset, selectedDatasetId,
}: {
  datasets: DatasetInfo[];
  loading: boolean;
  onRefresh: () => void;
  onSelectDataset: (id: string) => void;
  selectedDatasetId: string | null;
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>知识库列表</Typography>
        <IconButton onClick={onRefresh} size="small" disabled={loading}><RefreshIcon /></IconButton>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>
          新增知识库
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : datasets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <StorageIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
          <Typography>暂无知识库，点击右上角新增</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>名称</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>描述</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>分块方法</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>文档数</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>更新时间</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.map((ds) => (
                <TableRow key={ds.id} hover selected={ds.id === selectedDatasetId}
                  sx={{ cursor: 'pointer' }} onClick={() => onSelectDataset(ds.id)}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                      <Typography fontWeight={600}>{ds.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ds.description ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={CHUNK_LABELS[ds.chunk_method] ?? ds.chunk_method} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{ds.document_count}</TableCell>
                  <TableCell>{formatDate(ds.update_date)}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined"
                      onClick={(e) => { e.stopPropagation(); onSelectDataset(ds.id); }}>
                      查看文档
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>新增知识库</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField label="知识库名称 *" fullWidth value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            inputProps={{ maxLength: 128 }} error={!form.name.trim()}
            helperText={!form.name.trim() ? '名称不能为空' : ''} />
          <TextField label="描述" fullWidth multiline rows={2}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>分块方法</InputLabel>
            <Select value={form.chunk_method ?? ChunkMethod.NAIVE} label="分块方法"
              onChange={(e) => setForm({ ...form, chunk_method: e.target.value as ChunkMethod })}>
              {Object.entries(CHUNK_LABELS).map(([val, label]) => (
                <MenuItem key={val} value={val}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>访问权限</InputLabel>
            <Select value={form.permission ?? Permission.ME} label="访问权限"
              onChange={(e) => setForm({ ...form, permission: e.target.value as Permission })}>
              <MenuItem value={Permission.ME}>仅自己</MenuItem>
              <MenuItem value={Permission.TEAM}>团队</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleCreate}
            disabled={submitting || !form.name.trim()}>
            {submitting ? <CircularProgress size={18} /> : '创建'}
          </Button>
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
    } catch (e) {
      show(e instanceof Error ? e.message : '加载文档失败', 'error');
    } finally {
      setLoading(false);
    }
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
    if (invalid.length > 0) {
      show(`不支持的格式：${invalid.map((f) => f.name).join(', ')}，仅支持 pdf/txt/md`, 'error');
      return;
    }
    setUploadProgress(0);
    try {
      await uploadDocuments(datasetId, fileArr, setUploadProgress);
      show('上传成功', 'success');
      fetchDocs();
    } catch (e) {
      show(e instanceof Error ? e.message : '上传失败', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleParse = async (ids?: string[]) => {
    const targetIds = ids ?? selected;
    if (!targetIds.length) return;
    try {
      await parseDocuments(datasetId, { document_ids: targetIds });
      show('已提交解析任务', 'success');
      setTimeout(fetchDocs, 1500);
    } catch (e) {
      show(e instanceof Error ? e.message : '提交解析失败', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocuments(datasetId, selected.length > 0 ? selected : undefined);
      show('删除成功', 'success');
      setSelected([]); setDeleteConfirm(false); fetchDocs();
    } catch (e) {
      show(e instanceof Error ? e.message : '删除失败', 'error');
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = docs.length > 0 && selected.length === docs.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          文档管理
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            知识库：{datasetName}
          </Typography>
        </Typography>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>状态过滤</InputLabel>
          <Select value={statusFilter} label="状态过滤"
            onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">全部</MenuItem>
            {Object.values(DocumentStatus).map((s) => (
              <MenuItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton onClick={fetchDocs} size="small" disabled={loading}><RefreshIcon /></IconButton>
        {selected.length > 0 && (
          <>
            <Button size="small" variant="outlined" startIcon={<ParseIcon />}
              onClick={() => handleParse()}>解析选中({selected.length})</Button>
            <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}
              onClick={() => setDeleteConfirm(true)}>删除选中({selected.length})</Button>
          </>
        )}
        <Button variant="contained" startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2 }}>
          上传文档
        </Button>
      </Box>

      {uploadProgress !== null && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">上传中...</Typography>
            <Typography variant="caption">{uploadProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <Box onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        sx={{ border: '2px dashed', borderColor: dragOver ? 'primary.main' : 'grey.300',
          borderRadius: 2, p: 2, mb: 2, textAlign: 'center',
          bgcolor: dragOver ? 'primary.50' : 'grey.50', transition: 'all 0.2s', cursor: 'pointer' }}>
        <UploadIcon sx={{ fontSize: 32, color: dragOver ? 'primary.main' : 'grey.400', mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          拖拽文件到此处，或点击上传（支持 pdf / txt / md）
        </Typography>
      </Box>

      <input ref={fileInputRef} type="file" hidden multiple accept=".pdf,.txt,.md"
        onChange={(e) => e.target.files && handleUpload(e.target.files)} />

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />)}
        </Box>
      ) : docs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <DocIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography>暂无文档，请上传文件</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected}
                    onChange={(e) => setSelected(e.target.checked ? docs.map((d) => d.id) : [])} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>文件名</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>大小</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>解析状态</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>上传时间</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => {
                const runStatus = getDocumentRunStatus(doc);
                return (
                  <TableRow key={doc.id} hover selected={selected.includes(doc.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(doc.id)} onChange={() => toggleSelect(doc.id)} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight={500}>{doc.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{formatBytes(doc.size)}</Typography></TableCell>
                    <TableCell><StatusChip status={runStatus} /></TableCell>
                    <TableCell><Typography variant="body2">{formatDate(doc.create_date)}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {(runStatus === DocumentStatus.UNSTART || runStatus === DocumentStatus.FAIL) && (
                          <Tooltip title="解析此文档">
                            <IconButton size="small" color="primary" onClick={() => handleParse([doc.id])}>
                              <ParseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="删除">
                          <IconButton size="small" color="error"
                            onClick={() => { setSelected([doc.id]); setDeleteConfirm(true); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>确定要删除选中的 {selected.length} 个文档吗？此操作不可恢复。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>确认删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 聊天助手管理模块 ====================

function AssistantManagerPanel({
  datasets,
  onSelectAssistant,
  selectedAssistantId,
}: {
  datasets: DatasetInfo[];
  onSelectAssistant: (assistant: ChatAssistantInfo) => void;
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
      const resp = await listChatAssistants({
        page: 1, page_size: 50,
        name: searchName || undefined,
      });
      setAssistants(extractAssistants(resp));
    } catch (e) {
      show(e instanceof Error ? e.message : '加载助手列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchName, show]);

  useEffect(() => { fetchAssistants(); }, [fetchAssistants]);

  const handleCreate = async (data: CreateChatAssistantRequest) => {
    try {
      await createChatAssistant(data);
      show('聊天助手创建成功', 'success');
      setCreateOpen(false);
      fetchAssistants();
    } catch (e) {
      show(e instanceof Error ? e.message : '创建失败', 'error');
      throw e;
    }
  };

  const handleUpdate = async (data: CreateChatAssistantRequest) => {
    if (!editTarget) return;
    try {
      const updateBody: UpdateChatAssistantRequest = {
        name: data.name,
        dataset_ids: data.dataset_ids,
        llm: data.llm,
        prompt: data.prompt,
      };
      await updateChatAssistant(editTarget.id, updateBody);
      show('更新成功', 'success');
      setEditTarget(null);
      fetchAssistants();
    } catch (e) {
      show(e instanceof Error ? e.message : '更新失败', 'error');
      throw e;
    }
  };

  const handleDeleteOne = async (assistant: ChatAssistantInfo) => {
    setDeleteTarget(assistant);
    setSelectedIds([assistant.id]);
    setDeleteConfirm(true);
  };

  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget(null);
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteChatAssistants({ ids: selectedIds });
      show(`已删除 ${selectedIds.length} 个助手`, 'success');
      setSelectedIds([]);
      setDeleteTarget(null);
      setDeleteConfirm(false);
      fetchAssistants();
    } catch (e) {
      show(e instanceof Error ? e.message : '删除失败', 'error');
    }
  };

  const toggleSelectId = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = assistants.length > 0 && selectedIds.length === assistants.length;

  return (
    <Box>
      {/* 工具栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>聊天助手管理</Typography>
        <TextField size="small" placeholder="搜索助手名称..." value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 200 }} />
        <IconButton onClick={fetchAssistants} size="small" disabled={loading}><RefreshIcon /></IconButton>
        {selectedIds.length > 0 && (
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}
            onClick={handleDeleteBatch}>
            删除选中({selectedIds.length})
          </Button>
        )}
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>
          新建助手
        </Button>
      </Box>

      {/* 列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={88} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : assistants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <BotIcon sx={{ fontSize: 56, opacity: 0.3, mb: 1 }} />
          <Typography>暂无聊天助手，点击右上角新建</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* 全选行 */}
          <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
            <Checkbox size="small" checked={allSelected}
              indeterminate={selectedIds.length > 0 && !allSelected}
              onChange={(e) => setSelectedIds(e.target.checked ? assistants.map((a) => a.id) : [])} />
            <Typography variant="caption" color="text.secondary">全选</Typography>
          </Box>

          {assistants.map((assistant) => (
            <Card key={assistant.id} variant="outlined" sx={{
              borderRadius: 2,
              borderColor: assistant.id === selectedAssistantId ? 'primary.main' : 'divider',
              borderWidth: assistant.id === selectedAssistantId ? 2 : 1,
              transition: 'border-color 0.2s',
            }}>
              <CardContent sx={{ pb: '8px !important', pt: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  {/* 复选框 */}
                  <Checkbox size="small" checked={selectedIds.includes(assistant.id)}
                    onChange={() => toggleSelectId(assistant.id)}
                    onClick={(e) => e.stopPropagation()} sx={{ mt: -0.5 }} />

                  {/* 头像+内容 */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <BotIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap>{assistant.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {assistant.id.slice(0, 8)}...
                          &nbsp;·&nbsp;
                          关联 {assistant.dataset_ids.length} 个知识库
                          &nbsp;·&nbsp;
                          更新于 {formatDate(assistant.update_date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ pt: 0, px: 2, pb: 1.5, gap: 1 }}>
                {/* 进入会话管理 */}
                <Button size="small" variant="contained" endIcon={<SessionIcon />}
                  onClick={() => onSelectAssistant(assistant)}>
                  会话管理
                </Button>
                {/* 编辑 */}
                <Tooltip title="编辑助手">
                  <IconButton size="small" onClick={() => setEditTarget(assistant)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {/* 删除 */}
                <Tooltip title="删除助手">
                  <IconButton size="small" color="error" onClick={() => handleDeleteOne(assistant)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* 新建弹窗 */}
      <AssistantFormDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate} datasets={datasets} title="新建聊天助手" />

      {/* 编辑弹窗 */}
      <AssistantFormDialog open={!!editTarget} onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate} datasets={datasets}
        initialData={editTarget ?? undefined} title="编辑聊天助手" />

      {/* 删除确认 */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `确定删除助手「${deleteTarget.name}」吗？`
              : `确定删除选中的 ${selectedIds.length} 个助手吗？`}
            此操作不可恢复，关联的会话也将一并删除。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>确认删除</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== 会话管理模块 ====================

function SessionManagerPanel({
  assistant,
  onEnterChat,
}: {
  assistant: ChatAssistantInfo;
  onEnterChat: (session: SessionInfo) => void;
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
    } catch (e) {
      show(e instanceof Error ? e.message : '加载会话列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [assistant.id, show]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      // POST /api/ragflow/chat-assistants/{chat_id}/sessions
      await createSession(assistant.id, newSessionName.trim() || undefined);
      show('会话创建成功', 'success');
      setCreateOpen(false);
      setNewSessionName('');
      fetchSessions();
    } catch (e) {
      show(e instanceof Error ? e.message : '创建失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    setSubmitting(true);
    try {
      // PUT /api/ragflow/chat-assistants/{chat_id}/sessions/{session_id}
      await updateSession(assistant.id, renameTarget.id, { name: renameValue.trim() });
      show('重命名成功', 'success');
      setRenameTarget(null);
      fetchSessions();
    } catch (e) {
      show(e instanceof Error ? e.message : '重命名失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      // DELETE /api/ragflow/chat-assistants/{chat_id}/sessions
      await deleteSessions(assistant.id, { ids: deleteIds });
      show(`已删除 ${deleteIds.length} 个会话`, 'success');
      setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
      setDeleteIds([]);
      setDeleteConfirm(false);
      fetchSessions();
    } catch (e) {
      show(e instanceof Error ? e.message : '删除失败', 'error');
    }
  };

  const toggleSelectId = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const allSelected = sessions.length > 0 && selectedIds.length === sessions.length;

  return (
    <Box>
      {/* 标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BotIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          {assistant.name}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            的会话列表
          </Typography>
        </Typography>
        <IconButton onClick={fetchSessions} size="small" disabled={loading}><RefreshIcon /></IconButton>
        {selectedIds.length > 0 && (
          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}
            onClick={() => { setDeleteIds(selectedIds); setDeleteConfirm(true); }}>
            删除选中({selectedIds.length})
          </Button>
        )}
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2 }}>
          新建会话
        </Button>
      </Box>

      {/* 列表 */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : sessions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <SessionIcon sx={{ fontSize: 56, opacity: 0.3, mb: 1 }} />
          <Typography>暂无会话，点击右上角新建</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected}
                    indeterminate={selectedIds.length > 0 && !allSelected}
                    onChange={(e) => setSelectedIds(e.target.checked ? sessions.map((s) => s.id) : [])} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>会话名称</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>消息数</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>创建时间</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>更新时间</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(session.id)}
                      onChange={() => toggleSelectId(session.id)} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={500}>{session.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={`${session.messages?.length ?? 0} 条`} variant="outlined" />
                  </TableCell>
                  <TableCell><Typography variant="body2">{formatDate(session.create_date)}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{formatDate(session.update_date)}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {/* 进入对话 */}
                      <Tooltip title="进入对话">
                        <IconButton size="small" color="primary"
                          onClick={() => onEnterChat(session)}>
                          <GoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* 重命名 */}
                      <Tooltip title="重命名">
                        <IconButton size="small"
                          onClick={() => { setRenameTarget(session); setRenameValue(session.name); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {/* 删除 */}
                      <Tooltip title="删除">
                        <IconButton size="small" color="error"
                          onClick={() => { setDeleteIds([session.id]); setDeleteConfirm(true); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 新建会话弹窗 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新建会话</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="会话名称（选填）" value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="不填则自动命名" sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleCreate} disabled={submitting}>
            {submitting ? <CircularProgress size={18} /> : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重命名弹窗 */}
      <Dialog open={!!renameTarget} onClose={() => setRenameTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>重命名会话</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="新名称 *" value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            error={!renameValue.trim()} helperText={!renameValue.trim() ? '名称不能为空' : ''}
            sx={{ mt: 1 }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameTarget(null)}>取消</Button>
          <Button variant="contained" onClick={handleRename}
            disabled={submitting || !renameValue.trim()}>
            {submitting ? <CircularProgress size={18} /> : '确认'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除选中的 {deleteIds.length} 个会话吗？此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>取消</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>确认删除</Button>
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
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}
      sx={{ mt: 1, '&:before': { display: 'none' }, boxShadow: 'none',
        border: '1px solid', borderColor: 'divider', borderRadius: '8px !important' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, py: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuoteIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="caption" fontWeight={600} color="primary.main">
            引用溯源（{chunks.length} 处）
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {chunks.map((chunk, i) => (
          <Box key={chunk.id ?? i} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1,
            borderLeft: '3px solid', borderColor: 'primary.light' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                📄 {chunk.document_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                相似度：{(chunk.similarity * 100).toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {chunk.content}
            </Typography>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

// ==================== 智能对话模块 ====================

function ChatPanel({
  assistant,
  session,
  messages,
  currentSessionId,
  onMessagesChange,
  onSessionIdChange,
}: {
  assistant: ChatAssistantInfo;
  session: SessionInfo;
  /** 父组件持有的消息列表，切 Tab 不丢失 */
  messages: ChatMessage[];
  /** 父组件持有的真实 session_id */
  currentSessionId: string;
  /** 消息变更回调，支持函数式更新 */
  onMessagesChange: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  /** RAGFlow 回复中返回新 session_id 时通知父组件 */
  onSessionIdChange: (newId: string) => void;
}) {
  const { toast, show, close } = useToast();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || isLoading) return;
    setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: question, timestamp: Date.now() };
    const aId = uid();
    const assistantMsg: ChatMessage = { id: aId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
    onMessagesChange((prev) => [...prev, userMsg, assistantMsg]);

    await streamChat(
      assistant.id,
      { question, stream: true, session_id: currentSessionId },
      (data) => {
        if (data.session_id && data.session_id !== currentSessionId) {
          onSessionIdChange(data.session_id);
        }
        onMessagesChange((prev) => prev.map((m) =>
          m.id === aId ? { ...m, content: data.answer ?? m.content, reference: data.reference ?? m.reference } : m));
      },
      () => {
        onMessagesChange((prev) => prev.map((m) => m.id === aId ? { ...m, isStreaming: false } : m));
        setIsLoading(false);
      },
      (err) => {
        show(err.message, 'error');
        onMessagesChange((prev) => prev.map((m) =>
          m.id === aId ? { ...m, content: '❌ 请求出错，请重试', isStreaming: false } : m));
        setIsLoading(false);
      },
    );
  };

  const handleExport = () => {
    const content = messages
      .filter((m) => !m.isStreaming)
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
        <AiIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>{assistant.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            会话：{session.name}&nbsp;·&nbsp;ID: {currentSessionId.slice(0, 8)}...
          </Typography>
        </Box>
        {messages.length > 0 && (
          <>
            <Tooltip title="导出对话记录">
              <IconButton size="small" onClick={handleExport}><DownloadIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="清空显示（不删除会话）">
              <IconButton size="small" onClick={() => onMessagesChange([])}><ClearIcon fontSize="small" /></IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* 消息区 */}
      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'grey.50', borderRadius: 2,
        p: 2, display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', my: 'auto', color: 'text.secondary' }}>
            <ChatIcon sx={{ fontSize: 56, opacity: 0.25, mb: 1 }} />
            <Typography variant="body1" fontWeight={500}>开始与 AI 助手对话</Typography>
            <Typography variant="body2">{opener}</Typography>
          </Box>
        )}
        {messages.map((msg) => (
          <Box key={msg.id} sx={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 1.5, alignItems: 'flex-start',
          }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 13, fontWeight: 700 }}>
              {msg.role === 'user' ? '我' : 'AI'}
            </Box>
            <Box sx={{ maxWidth: '75%' }}>
              <Paper elevation={0} sx={{
                p: 1.5, borderRadius: 2, position: 'relative',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                border: msg.role === 'assistant' ? '1px solid' : 'none', borderColor: 'divider',
              }}>
                <Typography variant="body2" sx={{
                  whiteSpace: 'pre-wrap', lineHeight: 1.7,
                  '&::after': msg.isStreaming ? {
                    content: '"▋"', display: 'inline',
                    animation: 'blink 1s step-end infinite',
                    '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
                  } : {},
                }}>
                  {msg.content || (msg.isStreaming ? '' : '（空响应）')}
                </Typography>
                {msg.role === 'assistant' && !msg.isStreaming && (
                  <Tooltip title="复制">
                    <IconButton size="small"
                      sx={{ position: 'absolute', top: 4, right: 4, opacity: 0.4, '&:hover': { opacity: 1 } }}
                      onClick={() => navigator.clipboard.writeText(msg.content)}>
                      <CopyIcon sx={{ fontSize: 14 }} />
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
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField fullWidth multiline maxRows={4}
          placeholder="输入问题... (Ctrl+Enter 发送)"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendMessage(); } }}
          disabled={isLoading} size="small" sx={{ bgcolor: 'white' }} />
        <Button variant="contained"
          endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          onClick={sendMessage} disabled={isLoading || !input.trim()}
          sx={{ borderRadius: 2, px: 2.5, height: 40, flexShrink: 0 }}>
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

export default function RAGFlowPage() {
  const [tab, setTab] = useState(0);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  // 当前选中的助手（用于会话管理 Tab）
  const [activeAssistant, setActiveAssistant] = useState<ChatAssistantInfo | null>(null);
  // 当前选中的会话（用于对话 Tab）
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);
  // 按 sessionId 索引保存各会话消息，切换 Tab 后不丢失
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  // 保存 RAGFlow 返回的真实 session_id（首次回复后可能与传入的不同）
  const [sessionIdMap, setSessionIdMap] = useState<Record<string, string>>({});
  const { toast, show, close } = useToast();

  const fetchDatasets = useCallback(async () => {
    setDatasetsLoading(true);
    try {
      const resp = await listDatasets(1, 50);
      setDatasets(extractDatasets(resp));
    } catch (e) {
      show(e instanceof Error ? e.message : '加载知识库失败', 'error');
    } finally {
      setDatasetsLoading(false);
    }
  }, [show]);

  useEffect(() => { fetchDatasets(); }, [fetchDatasets]);

  const handleSelectDataset = (id: string) => { setSelectedDatasetId(id); setTab(1); };

  /** 从助手管理跳转到会话管理 */
  const handleSelectAssistant = (assistant: ChatAssistantInfo) => {
    setActiveAssistant(assistant);
    setTab(3);
  };

  /** 从会话管理跳转到对话 */
  const handleEnterChat = (session: SessionInfo) => {
    setActiveSession(session);
    setTab(4);
  };

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  const TABS = [
    { label: '知识库', icon: <StorageIcon /> },
    { label: '文档管理', icon: <DocIcon /> },
    { label: '助手管理', icon: <BotIcon /> },
    {
      label: '会话管理',
      icon: (
        <Badge badgeContent={activeAssistant ? '✓' : undefined} color="primary">
          <SessionIcon />
        </Badge>
      ),
    },
    {
      label: '智能对话',
      icon: (
        <Badge badgeContent={activeSession ? '✓' : undefined} color="success">
          <ChatIcon />
        </Badge>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AiIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>RAGFlow 智能问答</Typography>
          <Typography variant="body2" color="text.secondary">
            基于深度文档理解的检索增强生成引擎
          </Typography>
        </Box>
      </Box>

      {/* 面包屑提示 */}
      {(activeAssistant || activeSession) && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {activeAssistant && (
            <span>当前助手：<strong>{activeAssistant.name}</strong></span>
          )}
          {activeSession && (
            <span>　·　当前会话：<strong>{activeSession.name}</strong></span>
          )}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
              sx={{ fontWeight: 600, minHeight: 56 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
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
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <StorageIcon sx={{ fontSize: 56, opacity: 0.25, mb: 1 }} />
                  <Typography>请先在「知识库」中选择一个知识库</Typography>
                  <Button sx={{ mt: 2 }} onClick={() => setTab(0)}>前往选择</Button>
                </Box>
              )
          )}

          {/* Tab 2: 助手管理 */}
          {tab === 2 && (
            <AssistantManagerPanel
              datasets={datasets}
              onSelectAssistant={handleSelectAssistant}
              selectedAssistantId={activeAssistant?.id ?? null}
            />
          )}

          {/* Tab 3: 会话管理 */}
          {tab === 3 && (
            activeAssistant
              ? <SessionManagerPanel assistant={activeAssistant} onEnterChat={handleEnterChat} />
              : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <BotIcon sx={{ fontSize: 56, opacity: 0.25, mb: 1 }} />
                  <Typography>请先在「助手管理」中选择一个聊天助手</Typography>
                  <Button sx={{ mt: 2 }} onClick={() => setTab(2)}>前往选择</Button>
                </Box>
              )
          )}

          {/* Tab 4: 智能对话 */}
          {tab === 4 && (
            activeAssistant && activeSession
              ? <ChatPanel
                  assistant={activeAssistant}
                  session={activeSession}
                  messages={sessionMessages[activeSession.id] ?? []}
                  currentSessionId={sessionIdMap[activeSession.id] ?? activeSession.id}
                  onMessagesChange={(updater) =>
                    setSessionMessages((prev) => ({
                      ...prev,
                      [activeSession.id]: typeof updater === 'function'
                        ? updater(prev[activeSession.id] ?? [])
                        : updater,
                    }))
                  }
                  onSessionIdChange={(newId) =>
                    setSessionIdMap((prev) => ({ ...prev, [activeSession.id]: newId }))
                  }
                />
              : (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <ChatIcon sx={{ fontSize: 56, opacity: 0.25, mb: 1 }} />
                  <Typography>
                    {!activeAssistant ? '请先在「助手管理」选择助手' : '请先在「会话管理」选择或创建会话'}
                  </Typography>
                  <Button sx={{ mt: 2 }} onClick={() => setTab(activeAssistant ? 3 : 2)}>
                    {!activeAssistant ? '前往助手管理' : '前往会话管理'}
                  </Button>
                </Box>
              )
          )}
        </Box>
      </Paper>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={close}>
        <Alert severity={toast?.severity} onClose={close}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}