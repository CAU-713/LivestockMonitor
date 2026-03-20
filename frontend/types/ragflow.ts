/**
 * RAGFlow 核心类型定义
 * 严格对齐后端 app/schemas/ragflowDTO.py
 *
 * 放置路径：frontend/types/ragflow.ts
 */

// ==================== 枚举类型（与后端 Enum 完全一致） ====================

/** 分块方法枚举 */
export enum ChunkMethod {
  NAIVE = 'naive',
  BOOK = 'book',
  EMAIL = 'email',
  LAWS = 'laws',
  MANUAL = 'manual',
  ONE = 'one',
  PAPER = 'paper',
  PICTURE = 'picture',
  PRESENTATION = 'presentation',
  QA = 'qa',
  TABLE = 'table',
  TAG = 'tag',
}

/** 权限枚举 */
export enum Permission {
  ME = 'me',
  TEAM = 'team',
}

/**
 * 文档解析状态枚举
 * 注意：后端 service 层从 RAGFlow 原始 API 取的字段名是 "run"，
 * 但路由层统一封装后对外暴露的状态值仍是这些字符串
 */
export enum DocumentStatus {
  UNSTART = 'UNSTART',
  RUNNING = 'RUNNING',
  CANCEL = 'CANCEL',
  DONE = 'DONE',
  FAIL = 'FAIL',
}

// ==================== 请求类型（对齐 ragflowDTO 请求模型） ====================

/** 创建知识库请求 */
export interface CreateDatasetRequest {
  name: string;
  avatar?: string;
  description?: string;
  embedding_model?: string;
  permission?: Permission;
  chunk_method?: ChunkMethod;
  parser_config?: Record<string, unknown>;
  parse_type?: number;
  pipeline_id?: string;
}

/** 解析文档请求 */
export interface ParseDocumentsRequest {
  document_ids: string[];
}

/** 删除文档请求 */
export interface DeleteDocumentsRequest {
  ids?: string[];
}

/** LLM 配置（对齐 LLMConfig） */
export interface LLMConfig {
  model_name?: string;
  model_type?: string;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

/** Prompt 配置（对齐 PromptConfig） */
export interface PromptConfig {
  similarity_threshold?: number;
  keywords_similarity_weight?: number;
  top_n?: number;
  variables?: Record<string, unknown>[];
  rerank_model?: string;
  top_k?: number;
  empty_response?: string;
  opener?: string;
  show_quote?: boolean;
  prompt?: string;
}

/** 创建聊天助手请求 */
export interface CreateChatAssistantRequest {
  name: string;
  dataset_ids?: string[];
  avatar?: string;
  llm?: LLMConfig;
  prompt?: PromptConfig;
}

/** 创建会话请求 */
export interface CreateSessionRequest {
  name?: string;
  user_id?: string;
}

/** 聊天对话请求 */
export interface ChatCompletionRequest {
  question: string;
  stream?: boolean;
  session_id?: string;
  user_id?: string;
}

// ==================== 响应类型（对齐 ragflowDTO 响应模型） ====================

/** 知识库信息（对齐 DatasetInfo） */
export interface DatasetInfo {
  id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  chunk_method: string;
  chunk_count: number;
  document_count: number;
  embedding_model: string;
  permission: string;
  create_date: string;
  update_date: string;
}

/**
 * 文档信息（对齐 DocumentInfo）
 *
 * ⚠️ 重要：后端 service 层从 RAGFlow 原始 API 获取文档时，
 * 解析状态字段名为 "run"（不是 "status"）。
 * 路由层 get_documents_list 直接透传原始数据，因此文档对象里
 * 实际状态字段是 "run"，而 get_document_status 端点封装后返回 "status"。
 */
export interface DocumentInfo {
  id: string;
  name: string;
  size: number | null;
  chunk_method: string;
  created_by: string;
  create_date: string;
  /** 文档列表中状态字段实为 "run"，取值同 DocumentStatus 枚举 */
  run: string;
  /** get_document_status 端点返回的封装字段，与 run 值相同 */
  status?: string;
}

/** 上传文档响应（对齐 UploadDocumentsResponse） */
export interface UploadDocumentsResponse {
  code: number;
  message?: string;
  data: DocumentInfo[] | null;
}

/**
 * 知识库列表响应
 * 后端 service.list_datasets 透传 RAGFlow 原始响应：
 * { code: 0, data: DatasetInfo[] }
 */
export interface DatasetListResponse {
  code: number;
  message?: string;
  data: DatasetInfo[];
}

/**
 * 文档列表响应
 * 后端 service.get_documents_list 透传 RAGFlow 原始响应：
 * { code: 0, data: { docs: DocumentInfo[], total: number } }
 */
export interface DocumentListResponse {
  code: number;
  message?: string;
  data: {
    docs: DocumentInfo[];
    total: number;
  } | null;
}

/**
 * 文档状态响应
 * 路由层封装：{ code: 0, data: { document_id, dataset_id, status } }
 * status 取自 doc["run"]
 */
export interface DocumentStatusResponse {
  code: number;
  data: {
    document_id: string;
    dataset_id: string;
    status: string;
  } | null;
}

/** 聊天助手信息（对齐 ChatAssistantInfo） */
// export interface ChatAssistantInfo {
//   id: string;
//   name: string;
//   avatar: string | null;
//   dataset_ids: string[];
//   llm: Record<string, unknown>;
//   prompt: Record<string, unknown>;
//   create_date: string;
//   update_date: string;
// }

/** RAGFlow 原始返回的 dataset 简略信息（list_chat_assistants 时附带） */
export interface DatasetBrief {
  id: string;
  name: string;
  avatar: string | null;
  description: string | null;
  chunk_num?: number;
  doc_num?: number;
  embd_id?: string;
  parser_id?: string;
  permission?: string;
  create_date?: string;
  update_date?: string;
}

/**
 * 聊天助手信息（对齐后端修复后的 ChatAssistantInfo）
 *
 * 说明：
 * - dataset_ids：后端通过 validator 从 datasets 中提取，前端直接使用此字段
 * - datasets：RAGFlow 原始字段，后端透传时携带，前端可用于展示知识库名称
 *   （避免再次请求知识库列表）
 */
export interface ChatAssistantInfo {
  id: string;
  name: string;
  avatar: string | null;
  description?: string | null;

  /** 后端 validator 提取后的知识库 ID 列表（主要使用此字段） */
  dataset_ids: string[];

  /**
   * RAGFlow 原始返回的完整 dataset 对象列表
   * 后端设置了 exclude=True，正常情况下不会出现在响应中；
   * 若后端未完全过滤，前端忽略即可
   */
  datasets?: DatasetBrief[];

  llm: Record<string, unknown>;
  prompt: Record<string, unknown>;
  create_date: string;
  update_date: string;
}


// ==================== 同步更新 extractAssistants 工具函数 ====================
// 追加到 frontend/lib/api/ragflow.ts 中，替换原有 extractAssistants

/**
 * 从列出助手响应中提取数组，并做防御性处理：
 * - 若后端已修复（返回 dataset_ids），直接使用
 * - 若后端未完全修复（返回 datasets 原始数组），在前端兜底提取
 */
export function extractAssistantsSafe(
  resp: import('@/types/ragflow').ListChatAssistantsResponse,
): import('@/types/ragflow').ChatAssistantInfo[] {
  const list = resp.data ?? [];
  return list.map((item) => {
    // 兜底：若 dataset_ids 为空但 datasets 存在，前端提取
    const raw = item as import('@/types/ragflow').ChatAssistantInfo & {
      datasets?: import('@/types/ragflow').DatasetBrief[];
    };
    if ((!raw.dataset_ids || raw.dataset_ids.length === 0) && raw.datasets?.length) {
      return {
        ...raw,
        dataset_ids: raw.datasets.map((d) => d.id).filter(Boolean),
      };
    }
    return raw;
  });
}

/** 创建聊天助手响应 */
export interface CreateChatAssistantResponse {
  code: number;
  message?: string;
  data: ChatAssistantInfo | null;
}

/** 会话信息（对齐 SessionInfo） */
// export interface SessionInfo {
//   id: string;
//   chat_id: string;
//   name: string;
//   messages: Record<string, string>[];
//   create_date: string;
//   update_date: string;
// }

/** 会话中单条消息（对齐后端 SessionMessage） */
export interface SessionMessage {
  role: string;
  content: string;
  /** 引用块列表或空数组，RAGFlow 返回 [] 或 [{content, dataset_id, ...}] */
  reference?: unknown[] | Record<string, unknown> | string | null;
  /** 文档 ID 列表或空数组 */
  doc_ids?: string[] | string | null;
  /** 创建时间戳（float）或字符串 */
  created_at?: number | string | null;
  /** 允许其他未知字段 */
  [key: string]: unknown;
}

/** 会话信息（对齐后端修复后的 SessionInfo） */
export interface SessionInfo {
  id: string;
  chat_id: string;
  name: string;
  /** 使用 SessionMessage[] 替代 Record<string, string>[] */
  messages: SessionMessage[];
  create_date: string;
  update_date: string;
}

/** 创建会话响应 */
export interface CreateSessionResponse {
  code: number;
  message?: string;
  data: SessionInfo | null;
}

/**
 * 引用块信息（对齐 ChunkReference）
 * 后端完整字段：id / content / document_id / document_name /
 *               dataset_id / similarity / vector_similarity / term_similarity
 */
export interface ChunkReference {
  id: string;
  content: string;
  document_id: string;
  document_name: string;
  dataset_id: string;
  similarity: number;
  vector_similarity: number;
  term_similarity: number;
}

/** 聊天引用信息（对齐 ChatReference） */
export interface ChatReference {
  total: number;
  chunks: ChunkReference[];
  doc_aggs: Record<string, unknown>[];
}

/**
 * 聊天响应数据（对齐 ChatCompletionData）
 * 流式时每个 SSE chunk 都是此结构，最后一帧 data=true 表示结束
 */
export interface ChatCompletionData {
  answer: string;
  session_id: string;
  reference?: ChatReference | Record<string, unknown>;
  audio_binary?: string;
  id?: string;
  prompt?: string;
  created_at?: number;
}

/**
 * SSE 流结束帧结构
 * 后端最后一帧：{ code: 0, data: true }
 */
export interface StreamEndFrame {
  code: number;
  data: true;
}

// ==================== 前端内部使用类型 ====================

/** 聊天消息（前端 UI 状态） */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  reference?: ChatReference | Record<string, unknown>;
  isStreaming?: boolean;
}

/**
 * RAGFlow 补充类型定义 —— 聊天助手管理 & 会话管理
 */

// ==================== 聊天助手管理 - 请求类型 ====================

/** 更新聊天助手请求（对齐 UpdateChatAssistantRequest） */
export interface UpdateChatAssistantRequest {
  name: string;
  dataset_ids?: string[];
  avatar?: string;
  llm?: LLMConfig;
  prompt?: PromptConfig;
}

/** 删除聊天助手请求（对齐 DeleteChatAssistantsRequest） */
export interface DeleteChatAssistantsRequest {
  ids?: string[];
  delete_all?: boolean;
}

/** 列出聊天助手查询参数（对齐 ListChatAssistantsParams） */
export interface ListChatAssistantsParams {
  page?: number;
  page_size?: number;
  orderby?: 'create_time' | 'update_time';
  desc?: boolean;
  name?: string;
  id?: string;
}

// ==================== 会话管理 - 请求类型 ====================

/** 更新会话请求（对齐 UpdateSessionRequest） */
export interface UpdateSessionRequest {
  name: string;
  user_id?: string;
}

/** 删除会话请求（对齐 DeleteSessionsRequest） */
export interface DeleteSessionsRequest {
  ids?: string[];
  delete_all?: boolean;
}

/** 列出会话查询参数 */
export interface ListSessionsParams {
  page?: number;
  page_size?: number;
  orderby?: 'create_time' | 'update_time';
  desc?: boolean;
  name?: string;
  session_id?: string;
  user_id?: string;
}

// ==================== 聊天助手管理 - 响应类型 ====================

/**
 * 列出聊天助手响应（对齐 ListChatAssistantsResponse）
 * 后端透传 RAGFlow 原始响应：{ code: 0, data: ChatAssistantInfo[] }
 */
export interface ListChatAssistantsResponse {
  code: number;
  message?: string;
  data: ChatAssistantInfo[] | null;
}

/** 更新聊天助手响应（仅 code） */
export interface UpdateChatAssistantResponse {
  code: number;
  message?: string;
}

/** 删除聊天助手响应（仅 code） */
export interface DeleteChatAssistantsResponse {
  code: number;
  message?: string;
}

// ==================== 会话管理 - 响应类型 ====================

/**
 * 列出会话响应（对齐 ListSessionsResponse）
 * 后端透传 RAGFlow 原始响应：{ code: 0, data: SessionInfo[] }
 */
export interface ListSessionsResponse {
  code: number;
  message?: string;
  data: SessionInfo[] | null;
}

/** 更新会话响应（仅 code） */
export interface UpdateSessionResponse {
  code: number;
  message?: string;
}

/** 删除会话响应（仅 code） */
export interface DeleteSessionsResponse {
  code: number;
  message?: string;
}