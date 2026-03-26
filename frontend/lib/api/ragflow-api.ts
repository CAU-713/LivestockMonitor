/**
 * RAGFlow API 客户端
 * 严格对齐后端 app/routers/ragflowRouter.py 的路由路径与响应结构
 *
 * 放置路径：frontend/lib/api/ragflow.ts
 *
 * 后端路由前缀：/api/ragflow（由 router prefix 定义）
 * Next.js rewrite：/api/:path* → http://localhost:8000/:path*
 * 因此前端直接请求 /api/ragflow/... 即可
 *
 * ✅ 已校正的关键问题：
 * 1. 知识库列表响应：data 字段直接是 DatasetInfo[]（非嵌套对象）
 * 2. 文档列表响应：data.docs（DocumentInfo[]），状态字段是 "run" 而非 "status"
 * 3. 文档状态响应：data.data.status（有两层 data）
 * 4. ChatCompletionData 补全了 id/prompt/created_at/audio_binary 字段
 * 5. ChunkReference 补全了完整引用字段
 */

import type {
  CreateDatasetRequest,
  DatasetInfo,
  DatasetListResponse,
  DocumentInfo,
  DocumentListResponse,
  DocumentStatusResponse,
  ParseDocumentsRequest,
  UploadDocumentsResponse,
  CreateChatAssistantRequest,
  CreateChatAssistantResponse,
  CreateSessionResponse,
  ChatCompletionRequest,
  ChatCompletionData,
  StreamEndFrame,
  UpdateChatAssistantRequest,
  UpdateChatAssistantResponse,
  DeleteChatAssistantsRequest,
  DeleteChatAssistantsResponse,
  ListChatAssistantsParams,
  ListChatAssistantsResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
  DeleteSessionsRequest,
  DeleteSessionsResponse,
  ListSessionsParams,
  ListSessionsResponse,
} from '@/types/ragflow';

/** 后端路由前缀（经 Next.js rewrite 代理） */
const BASE = '/api/ragflow';

// ==================== 知识库管理 ====================

/**
 * 获取知识库列表
 * GET /api/ragflow/datasets?page=&page_size=
 *
 * 后端响应结构（透传 RAGFlow 原始响应）：
 * { code: 0, data: DatasetInfo[] }
 */
export async function listDatasets(
  page: number = 1,
  pageSize: number = 50,
): Promise<DatasetListResponse> {
  const res = await fetch(
    `${BASE}/datasets?page=${page}&page_size=${pageSize}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(err.detail ?? `获取知识库列表失败: ${res.status}`);
  }
  return res.json() as Promise<DatasetListResponse>;
}

/**
 * 创建知识库
 * POST /api/ragflow/datasets
 * 响应：CreateDatasetResponse { code, data: DatasetInfo }
 */
export async function createDataset(
  body: CreateDatasetRequest,
): Promise<{ code: number; data: DatasetInfo | null; message?: string }> {
  const res = await fetch(`${BASE}/datasets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '创建失败' }));
    throw new Error(err.detail ?? '创建知识库失败');
  }
  return res.json();
}

// ==================== 文档管理 ====================

/**
 * 获取文档列表
 * GET /api/ragflow/datasets/{dataset_id}/documents?page=&page_size=&status_filter=
 *
 * 后端响应结构（透传 RAGFlow 原始响应）：
 * { code: 0, data: { docs: DocumentInfo[], total: number } }
 *
 * ⚠️ 注意：docs 中每个文档的解析状态字段名是 "run"，不是 "status"
 * status_filter 参数：多个状态用逗号分隔，如 "DONE,RUNNING"
 */
export async function listDocuments(
  datasetId: string,
  page: number = 1,
  pageSize: number = 50,
  statusFilter?: string,
): Promise<DocumentListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (statusFilter) params.append('status_filter', statusFilter);

  const res = await fetch(
    `${BASE}/datasets/${datasetId}/documents?${params.toString()}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(err.detail ?? `获取文档列表失败: ${res.status}`);
  }
  return res.json() as Promise<DocumentListResponse>;
}

/**
 * 上传文档到知识库（multipart/form-data）
 * POST /api/ragflow/datasets/{dataset_id}/documents
 * 字段名：files（List[UploadFile]）
 *
 * 响应：UploadDocumentsResponse { code, data: DocumentInfo[] }
 */
export async function uploadDocuments(
  datasetId: string,
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<UploadDocumentsResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/datasets/${datasetId}/documents`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadDocumentsResponse);
      } else {
        try {
          const errBody = JSON.parse(xhr.responseText) as { detail?: string };
          reject(new Error(errBody.detail ?? `上传失败: ${xhr.status}`));
        } catch {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('上传请求网络异常'));
    xhr.send(formData);
  });
}

/**
 * 解析文档
 * POST /api/ragflow/datasets/{dataset_id}/parse
 * Body: { document_ids: string[] }
 *
 * 响应：ParseDocumentsResponse { code, data }
 */
export async function parseDocuments(
  datasetId: string,
  body: ParseDocumentsRequest,
): Promise<{ code: number; data: unknown }> {
  const res = await fetch(`${BASE}/datasets/${datasetId}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '解析提交失败' }));
    throw new Error(err.detail ?? '解析文档失败');
  }
  return res.json();
}

/**
 * 删除文档
 * DELETE /api/ragflow/datasets/{dataset_id}/documents
 * Body: { ids?: string[] }  —— ids 为空则删除全部
 *
 * 响应：DeleteDocumentsResponse { code }
 */
export async function deleteDocuments(
  datasetId: string,
  ids?: string[],
): Promise<{ code: number }> {
  const res = await fetch(`${BASE}/datasets/${datasetId}/documents`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '删除失败' }));
    throw new Error(err.detail ?? '删除文档失败');
  }
  return res.json();
}

/**
 * 查询文档解析状态
 * GET /api/ragflow/datasets/{dataset_id}/documents/{document_id}/status
 *
 * 后端响应结构：
 * { code: 0, data: { document_id, dataset_id, status: string } }
 * status 值取自文档的 "run" 字段，可能值：UNSTART/RUNNING/CANCEL/DONE/FAIL
 */
export async function getDocumentStatus(
  datasetId: string,
  documentId: string,
): Promise<DocumentStatusResponse> {
  const res = await fetch(
    `${BASE}/datasets/${datasetId}/documents/${documentId}/status`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '查询失败' }));
    throw new Error(err.detail ?? `查询文档状态失败: ${res.status}`);
  }
  return res.json() as Promise<DocumentStatusResponse>;
}

// ==================== 聊天助手管理 ====================

/**
 * 创建聊天助手
 * POST /api/ragflow/chat-assistants
 * Body: CreateChatAssistantRequest
 *
 * 响应：CreateChatAssistantResponse { code, data: ChatAssistantInfo }
 */
export async function createChatAssistant(
  body: CreateChatAssistantRequest,
): Promise<CreateChatAssistantResponse> {
  const res = await fetch(`${BASE}/chat-assistants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '创建失败' }));
    throw new Error(err.detail ?? '创建聊天助手失败');
  }
  return res.json() as Promise<CreateChatAssistantResponse>;
}

/**
 * 创建会话
 * POST /api/ragflow/chat-assistants/{chat_id}/sessions
 * Body: { name?: string, user_id?: string }
 *
 * 响应：CreateSessionResponse { code, data: SessionInfo }
 */
export async function createSession(
  chatId: string,
  name?: string,
  userId?: string,
): Promise<CreateSessionResponse> {
  const res = await fetch(`${BASE}/chat-assistants/${chatId}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name ?? '新会话', user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '创建会话失败' }));
    throw new Error(err.detail ?? '创建会话失败');
  }
  return res.json() as Promise<CreateSessionResponse>;
}

// ==================== 智能对话（流式 SSE） ====================
/** RAGFlow SSE 数据帧的外层包装结构（实际抓包确认） */
interface RAGFlowSSEFrame {
  code: number;
  message?: string;
  /** 数据帧时为 ChatCompletionData 对象；结束帧时为 true */
  data: ChatCompletionData | true;
}

export async function streamChat(
  chatId: string,
  body: ChatCompletionRequest,
  onChunk: (data: ChatCompletionData) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const res = await fetch(
      `/api/ragflow/chat-assistants/${chatId}/completions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, stream: true }),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`对话请求失败 ${res.status}: ${errText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('无法读取响应流');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按 \n\n 切分完整 SSE 事件块
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        for (const line of part.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          let frame: RAGFlowSSEFrame;
          try {
            frame = JSON.parse(jsonStr) as RAGFlowSSEFrame;
          } catch {
            continue;
          }

          // ✅ 结束帧：{ code:0, message:"", data:true }
          if (frame.data === true) {
            onDone();
            return;
          }

          // ✅ 数据帧：从 frame.data 中取 answer / session_id / reference
          const inner = frame.data as ChatCompletionData;
          if (inner && typeof inner.answer === 'string') {
            onChunk(inner);
          }
        }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// ==================== 响应数据提取工具函数 ====================

/**
 * 从知识库列表响应中提取 DatasetInfo 数组
 *
 * 后端透传 RAGFlow 响应：{ code: 0, data: DatasetInfo[] }
 * data 直接是数组
 */
export function extractDatasets(resp: DatasetListResponse): DatasetInfo[] {
  if (!resp.data) return [];
  if (Array.isArray(resp.data)) return resp.data;
  return [];
}

/**
 * 从文档列表响应中提取 DocumentInfo 数组
 *
 * 后端透传 RAGFlow 响应：{ code: 0, data: { docs: [...], total: N } }
 * ⚠️ 文档对象中解析状态字段名是 "run"，不是 "status"
 */
export function extractDocuments(resp: DocumentListResponse): DocumentInfo[] {
  if (!resp.data) return [];
  if (Array.isArray(resp.data)) return resp.data as DocumentInfo[];
  if ('docs' in resp.data && Array.isArray(resp.data.docs)) {
    return resp.data.docs;
  }
  return [];
}

/**
 * 获取文档的实际解析状态
 * 文档列表中状态字段是 "run"，状态接口返回的是 "status"
 * 统一通过此函数获取，避免遗漏
 */
export function getDocumentRunStatus(doc: DocumentInfo): string {
  return doc.run ?? doc.status ?? 'UNSTART';
}

/**
 * RAGFlow API 补充函数 —— 聊天助手管理 & 会话管理
 */

// ==================== 聊天助手管理 ====================

/**
 * 列出聊天助手
 * GET /api/ragflow/chat-assistants
 * Query: page / page_size / orderby / desc / name / chat_id
 *
 * 响应：{ code: 0, data: ChatAssistantInfo[] }
 */
export async function listChatAssistants(
  params: ListChatAssistantsParams = {},
): Promise<ListChatAssistantsResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.page_size !== undefined)
    query.append('page_size', String(params.page_size));
  if (params.orderby) query.append('orderby', params.orderby);
  if (params.desc !== undefined) query.append('desc', String(params.desc));
  if (params.name) query.append('name', params.name);
  if (params.id) query.append('chat_id', params.id);

  const res = await fetch(
    `${BASE}/chat-assistants?${query.toString()}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(err.detail ?? `获取助手列表失败: ${res.status}`);
  }
  return res.json() as Promise<ListChatAssistantsResponse>;
}

/**
 * 更新聊天助手
 * PUT /api/ragflow/chat-assistants/{chat_id}
 * Body: UpdateChatAssistantRequest（name 必填）
 *
 * 响应：{ code: 0 }
 */
export async function updateChatAssistant(
  chatId: string,
  body: UpdateChatAssistantRequest,
): Promise<UpdateChatAssistantResponse> {
  const res = await fetch(`${BASE}/chat-assistants/${chatId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '更新失败' }));
    throw new Error(err.detail ?? '更新聊天助手失败');
  }
  return res.json() as Promise<UpdateChatAssistantResponse>;
}

/**
 * 删除聊天助手（批量 / 全部）
 * DELETE /api/ragflow/chat-assistants
 * Body: { ids?: string[], delete_all?: boolean }
 *
 * 响应：{ code: 0 }
 */
export async function deleteChatAssistants(
  body: DeleteChatAssistantsRequest,
): Promise<DeleteChatAssistantsResponse> {
  const res = await fetch(`${BASE}/chat-assistants`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '删除失败' }));
    throw new Error(err.detail ?? '删除聊天助手失败');
  }
  return res.json() as Promise<DeleteChatAssistantsResponse>;
}

// ==================== 会话管理 ====================

/**
 * 列出会话
 * GET /api/ragflow/chat-assistants/{chat_id}/sessions
 * Query: page / page_size / orderby / desc / name / session_id / user_id
 *
 * 响应：{ code: 0, data: SessionInfo[] }
 */
export async function listSessions(
  chatId: string,
  params: ListSessionsParams = {},
): Promise<ListSessionsResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.append('page', String(params.page));
  if (params.page_size !== undefined)
    query.append('page_size', String(params.page_size));
  if (params.orderby) query.append('orderby', params.orderby);
  if (params.desc !== undefined) query.append('desc', String(params.desc));
  if (params.name) query.append('name', params.name);
  if (params.session_id) query.append('session_id', params.session_id);
  if (params.user_id) query.append('user_id', params.user_id);

  const res = await fetch(
    `${BASE}/chat-assistants/${chatId}/sessions?${query.toString()}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(err.detail ?? `获取会话列表失败: ${res.status}`);
  }
  return res.json() as Promise<ListSessionsResponse>;
}

/**
 * 更新会话
 * PUT /api/ragflow/chat-assistants/{chat_id}/sessions/{session_id}
 * Body: { name: string, user_id?: string }
 *
 * 响应：{ code: 0 }
 */
export async function updateSession(
  chatId: string,
  sessionId: string,
  body: UpdateSessionRequest,
): Promise<UpdateSessionResponse> {
  const res = await fetch(
    `${BASE}/chat-assistants/${chatId}/sessions/${sessionId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '更新失败' }));
    throw new Error(err.detail ?? '更新会话失败');
  }
  return res.json() as Promise<UpdateSessionResponse>;
}

/**
 * 删除会话（批量 / 全部）
 * DELETE /api/ragflow/chat-assistants/{chat_id}/sessions
 * Body: { ids?: string[], delete_all?: boolean }
 *
 * 响应：{ code: 0 }
 */
export async function deleteSessions(
  chatId: string,
  body: DeleteSessionsRequest,
): Promise<DeleteSessionsResponse> {
  const res = await fetch(
    `${BASE}/chat-assistants/${chatId}/sessions`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '删除失败' }));
    throw new Error(err.detail ?? '删除会话失败');
  }
  return res.json() as Promise<DeleteSessionsResponse>;
}

// ==================== 工具函数 ====================

/**
 * 从列出助手响应中提取数组
 * { code: 0, data: ChatAssistantInfo[] }
 */
export function extractAssistants(
  resp: ListChatAssistantsResponse,
): import('@/types/ragflow').ChatAssistantInfo[] {
  return resp.data ?? [];
}

/**
 * 从列出会话响应中提取数组
 * { code: 0, data: SessionInfo[] }
 */
export function extractSessions(
  resp: ListSessionsResponse,
): import('@/types/ragflow').SessionInfo[] {
  return resp.data ?? [];
}