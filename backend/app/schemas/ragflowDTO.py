"""
RAGFlow API Models
数据模型定义，用于请求验证和响应序列化
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any,Union
from enum import Enum

class ChunkMethod(str, Enum):
    """分块方法枚举"""
    NAIVE = "naive"
    BOOK = "book"
    EMAIL = "email"
    LAWS = "laws"
    MANUAL = "manual"
    ONE = "one"
    PAPER = "paper"
    PICTURE = "picture"
    PRESENTATION = "presentation"
    QA = "qa"
    TABLE = "table"
    TAG = "tag"


class Permission(str, Enum):
    """权限枚举"""
    ME = "me"
    TEAM = "team"


# ==================== 请求模型 ====================

class CreateDatasetRequest(BaseModel):
    """创建知识库请求"""
    name: str = Field(..., max_length=128, description="知识库名称")
    avatar: Optional[str] = Field(None, max_length=65535, description="Base64编码的头像")
    description: Optional[str] = Field(None, max_length=65535, description="知识库描述")
    embedding_model: Optional[str] = Field(None, max_length=255, description="嵌入模型")
    permission: Optional[Permission] = Field(Permission.ME, description="访问权限")
    chunk_method: Optional[ChunkMethod] = Field(None, description="分块方法")
    parser_config: Optional[Dict[str, Any]] = Field(None, description="解析器配置")
    parse_type: Optional[int] = Field(None, description="管道解析类型")
    pipeline_id: Optional[str] = Field(None, min_length=32, max_length=32, description="管道ID")

    @validator('pipeline_id')
    def validate_pipeline_id(cls, v):
        """验证pipeline_id格式"""
        if v is not None and not all(c in '0123456789abcdef' for c in v):
            raise ValueError('pipeline_id必须是32位小写十六进制字符串')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "我的知识库",
                "description": "这是一个测试知识库",
                "chunk_method": "naive",
                "parser_config": {
                    "chunk_token_num": 512,
                    "delimiter": "\n"
                }
            }
        }


class ParseDocumentsRequest(BaseModel):
    """解析文档请求"""
    document_ids: List[str] = Field(..., min_items=1, description="文档ID列表")

    class Config:
        json_schema_extra = {
            "example": {
                "document_ids": ["doc_id_1", "doc_id_2"]
            }
        }


class DeleteDocumentsRequest(BaseModel):
    """删除文档请求"""
    ids: Optional[List[str]] = Field(None, description="文档ID列表，为空则删除所有")

    class Config:
        json_schema_extra = {
            "example": {
                "ids": ["doc_id_1", "doc_id_2"]
            }
        }


class LLMConfig(BaseModel):
    """LLM配置"""
    model_name: Optional[str] = Field(None, description="模型名称")
    model_type: Optional[str] = Field(None, description="模型类型")
    temperature: Optional[float] = Field(0.1, ge=0, le=2, description="温度参数")
    top_p: Optional[float] = Field(0.3, ge=0, le=1, description="Top-p参数")
    presence_penalty: Optional[float] = Field(0.4, ge=-2, le=2, description="存在惩罚")
    frequency_penalty: Optional[float] = Field(0.7, ge=-2, le=2, description="频率惩罚")

    class Config:
        json_schema_extra = {
            "example": {
                "model_name": "qwen-plus@Tongyi-Qianwen",
                "temperature": 0.1,
                "top_p": 0.3
            }
        }


class PromptConfig(BaseModel):
    """提示配置"""
    similarity_threshold: Optional[float] = Field(0.2, ge=0, le=1, description="相似度阈值")
    keywords_similarity_weight: Optional[float] = Field(0.7, ge=0, le=1, description="关键词相似度权重")
    top_n: Optional[int] = Field(6, ge=1, description="Top N块数量")
    variables: Optional[List[Dict[str, Any]]] = Field(None, description="变量列表")
    rerank_model: Optional[str] = Field(None, description="重排序模型")
    top_k: Optional[int] = Field(1024, ge=1, description="Top K值")
    empty_response: Optional[str] = Field(None, description="无结果响应")
    opener: Optional[str] = Field(None, description="开场白")
    show_quote: Optional[bool] = Field(True, description="是否显示引用")
    prompt: Optional[str] = Field(None, description="提示内容")

    class Config:
        json_schema_extra = {
            "example": {
                "similarity_threshold": 0.2,
                "top_n": 6,
                "opener": "您好！我是您的AI助手"
            }
        }


class CreateChatAssistantRequest(BaseModel):
    """创建聊天助手请求"""
    name: str = Field(..., description="助手名称")
    dataset_ids: Optional[List[str]] = Field(None, description="关联的知识库ID列表")
    avatar: Optional[str] = Field(None, description="Base64编码的头像")
    llm: Optional[LLMConfig] = Field(None, description="LLM配置")
    prompt: Optional[PromptConfig] = Field(None, description="提示配置")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "我的助手",
                "dataset_ids": ["dataset_id_1"],
                "llm": {
                    "model_name": "qwen-plus@Tongyi-Qianwen",
                    "temperature": 0.1
                }
            }
        }


class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    name: Optional[str] = Field(None, description="会话名称")
    user_id: Optional[str] = Field(None, description="用户自定义ID")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "新对话",
                "user_id": "user_123"
            }
        }


# ==================== 响应模型 ====================

class BaseResponse(BaseModel):
    """基础响应"""
    code: int = Field(..., description="状态码，0表示成功")
    message: Optional[str] = Field(None, description="错误信息")


class DatasetInfo(BaseModel):
    """知识库信息"""
    id: str
    name: str
    avatar: Optional[str] = None
    description: Optional[str] = None
    chunk_method: str
    chunk_count: int
    document_count: int
    embedding_model: str
    permission: str
    create_date: str
    update_date: str


class CreateDatasetResponse(BaseResponse):
    """创建知识库响应"""
    data: Optional[DatasetInfo] = None


class DocumentInfo(BaseModel):
    """文档信息"""
    id: str
    name: str
    size: Optional[int] = None
    chunk_method: Optional[str] = None
    created_by: Optional[str] = None
    create_date: Optional[str] = None
    status: Optional[str] = None
    dataset_id: Optional[str] = None
    location: Optional[str] = None
    parser_config: Optional[Dict[str, Any]] = None
    pipeline_id: Optional[str] = None
    run: Optional[str] = None
    source_type: Optional[str] = None
    suffix: Optional[str] = None
    thumbnail: Optional[str] = None
    type: Optional[str] = None


class UploadDocumentsResponse(BaseResponse):
    """上传文档响应"""
    data: Optional[List[DocumentInfo]] = None


class ParseDocumentsResponse(BaseResponse):
    """解析文档响应"""
    data: Optional[Dict[str, Any]] = None


class DeleteDocumentsResponse(BaseResponse):
    """删除文档响应"""
    pass


class ChatAssistantInfo(BaseModel):
    """
    聊天助手信息

    RAGFlow 原始 API 返回字段名为 "datasets"（完整 DatasetInfo 对象列表），
    通过 validator 自动从 datasets 提取 id 列表，填充到 dataset_ids 字段，
    保持与前端约定的接口格式一致。
    """
    id: str
    name: str
    avatar: Optional[str] = None
    description: Optional[str] = None

    # RAGFlow 原始字段：完整的 dataset 对象列表
    # 设为 Optional 以兼容创建接口返回（可能已经是 dataset_ids 格式）
    datasets: Optional[List[Dict[str, Any]]] = Field(None, exclude=True)

    # 对外暴露的字段：知识库 ID 列表
    dataset_ids: Optional[List[str]] = Field(default_factory=list)

    llm: Dict[str, Any] = Field(default_factory=dict)
    prompt: Dict[str, Any] = Field(default_factory=dict)
    create_date: str = ""
    update_date: str = ""

    @validator('dataset_ids', pre=True, always=True)
    def extract_dataset_ids(cls, v, values):
        """
        如果 dataset_ids 为空/None，尝试从 datasets 字段中提取 id。
        兼容两种数据来源：
          1. list_chat_assistants 返回：datasets=[{id:..., name:...}, ...]
          2. create_chat_assistant 返回：dataset_ids=[...] 或 datasets=[...]
        """
        # 已有有效值则直接使用
        if v:
            return v

        # 从 datasets 字段提取
        datasets = values.get('datasets')
        if datasets and isinstance(datasets, list):
            extracted = []
            for item in datasets:
                if isinstance(item, dict):
                    item_id = item.get('id')
                    if item_id:
                        extracted.append(item_id)
                elif isinstance(item, str):
                    # 兼容直接传 id 字符串的情况
                    extracted.append(item)
            return extracted

        return v or []

    class Config:
        # 允许额外字段（RAGFlow 返回字段比模型多）
        extra = 'allow'
        json_schema_extra = {
            "example": {
                "id": "chat_id_123",
                "name": "我的助手",
                "dataset_ids": ["dataset_id_1"],
                "llm": {"model_name": "qwen-max@Tongyi-Qianwen"},
                "prompt": {"opener": "您好！"},
                "create_date": "2024-01-01T00:00:00",
                "update_date": "2024-01-01T00:00:00"
            }
        }


class CreateChatAssistantResponse(BaseResponse):
    """创建聊天助手响应"""
    data: Optional[ChatAssistantInfo] = None


# class SessionInfo(BaseModel):
#     """会话信息"""
#     id: str
#     chat_id: str
#     name: str
#     messages: List[Dict[str, str]]
#     create_date: str
#     update_date: str

class SessionMessage(BaseModel):
    """
    会话中单条消息
    RAGFlow 实际返回字段类型比 Dict[str, str] 复杂，需单独定义。
    """
    role: str = ""
    content: str = ""

    # reference 可能是空列表 [] 或引用块对象列表，不是字符串
    reference: Optional[Union[List[Any], Dict[str, Any], str]] = None

    # doc_ids 可能是空列表 []
    doc_ids: Optional[Union[List[str], str]] = None

    # created_at 可能是 float 时间戳，也可能是字符串
    created_at: Optional[Union[float, int, str]] = None

    # 允许 RAGFlow 返回其他未知字段（如 prompt、audio_binary 等）
    class Config:
        extra = "allow"


class SessionInfo(BaseModel):
    """
    会话信息

    修复点：messages 从 List[Dict[str, str]] 改为 List[SessionMessage]，
    以兼容 RAGFlow 返回的非字符串字段（reference/doc_ids/created_at）。
    """
    id: str
    chat_id: str
    name: str

    # 使用 SessionMessage 替代 Dict[str, str]
    messages: List[SessionMessage] = Field(default_factory=list)

    create_date: str = ""
    update_date: str = ""

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {
                "id": "session_id_123",
                "chat_id": "chat_id_456",
                "name": "新会话",
                "messages": [
                    {
                        "role": "user",
                        "content": "你好",
                        "reference": [],
                        "doc_ids": [],
                        "created_at": 1773921511.818966
                    }
                ],
                "create_date": "2024-01-01T00:00:00",
                "update_date": "2024-01-01T00:00:00"
            }
        }


class CreateSessionResponse(BaseResponse):
    """创建会话响应"""
    data: Optional[SessionInfo] = None


# ==================== 通用响应 ====================

class ErrorResponse(BaseModel):
    """错误响应"""
    code: int
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "code": 101,
                "message": "操作失败的具体原因"
            }
        }


class SuccessResponse(BaseModel):
    """成功响应"""
    code: int = 0
    message: str = "操作成功"
    data: Optional[Any] = None


# ==================== 文档状态相关模型 ====================

class DocumentStatus(str, Enum):
    """文档解析状态枚举"""
    UNSTART = "UNSTART"  # 未开始
    RUNNING = "RUNNING"  # 解析中
    CANCEL = "CANCEL"  # 已取消
    DONE = "DONE"  # 解析完成
    FAIL = "FAIL"  # 解析失败


class DocumentStatusInfo(BaseModel):
    """单个文档状态信息"""
    id: str
    name: str
    status: str


class DocumentStatusResponse(BaseModel):
    """查询文档状态响应"""
    code: int = 0
    data: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "code": 0,
                "data": {
                    "document_id": "doc_123",
                    "status": "DONE"
                }
            }
        }


class DatasetReadinessResponse(BaseModel):
    """知识库就绪状态响应"""
    code: int = 0
    data: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "code": 0,
                "data": {
                    "ready": True,
                    "total": 10,
                    "done": 10,
                    "running": 0,
                    "failed": 0,
                    "unstart": 0,
                    "cancel": 0,
                    "documents": [
                        {
                            "id": "doc_1",
                            "name": "document1.pdf",
                            "status": "DONE"
                        }
                    ]
                }
            }
        }


class DocumentsListResponse(BaseModel):
    """文档列表响应"""
    code: int = 0
    data: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "code": 0,
                "data": {
                    "docs": [
                        {
                            "id": "doc_1",
                            "name": "document.pdf",
                            "run": "DONE"
                        }
                    ],
                    "total": 1
                }
            }
        }


# ==================== 聊天对话相关模型 ====================

class MetadataCondition(BaseModel):
    """元数据过滤条件"""
    name: str = Field(..., description="元数据键名")
    comparison_operator: str = Field(
        ...,
        description="比较操作符: is, not is, contains, not contains, start with, end with, empty, not empty, >, <, ≥, ≤"
    )
    value: Optional[Union[str, int, float, bool]] = Field(None, description="比较值")


class MetadataFilter(BaseModel):
    """元数据过滤器"""
    logic: str = Field(..., description="逻辑运算符: and 或 or")
    conditions: List[MetadataCondition] = Field(..., description="条件列表")

    class Config:
        json_schema_extra = {
            "example": {
                "logic": "and",
                "conditions": [
                    {
                        "name": "author",
                        "comparison_operator": "is",
                        "value": "bob"
                    }
                ]
            }
        }


class ChatCompletionRequest(BaseModel):
    """聊天对话请求"""
    question: str = Field(..., description="用户问题")
    stream: bool = Field(True, description="是否使用流式输出")
    session_id: Optional[str] = Field(None, description="会话ID")
    user_id: Optional[str] = Field(None, description="用户自定义ID")
    metadata_condition: Optional[MetadataFilter] = Field(None, description="元数据过滤条件")

    class Config:
        json_schema_extra = {
            "example": {
                "question": "Who are you?",
                "stream": True,
                "session_id": "9fa7691cb85c11ef9c5f0242ac120005",
                "metadata_condition": {
                    "logic": "and",
                    "conditions": [
                        {
                            "name": "author",
                            "comparison_operator": "is",
                            "value": "bob"
                        }
                    ]
                }
            }
        }


class ChunkReference(BaseModel):
    """引用块信息"""
    id: str
    content: str
    document_id: str
    document_name: str
    dataset_id: str
    similarity: float
    vector_similarity: float
    term_similarity: float


class ChatReference(BaseModel):
    """聊天引用信息"""
    total: int
    chunks: List[ChunkReference]
    doc_aggs: List[Dict[str, Any]]


class ChatCompletionData(BaseModel):
    """聊天响应数据"""
    answer: str
    reference: Optional[Dict[str, Any]] = None
    audio_binary: Optional[str] = None
    id: Optional[str] = None
    session_id: str
    prompt: Optional[str] = None
    created_at: Optional[float] = None


class ChatCompletionResponse(BaseModel):
    """聊天对话响应"""
    code: int = 0
    message: Optional[str] = None
    data: Optional[Union[ChatCompletionData, bool]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "code": 0,
                "data": {
                    "answer": "Hi! I'm your assistant.",
                    "reference": {},
                    "session_id": "b01eed84b85611efa0e90242ac120005"
                }
            }
        }

"""
RAGFlow DTO 补充代码
"""

# ==================== 聊天助手管理 - 新增请求模型 ====================

class UpdateChatAssistantRequest(BaseModel):
    """更新聊天助手请求"""
    name: str = Field(..., description="助手名称（必填）")
    dataset_ids: Optional[List[str]] = Field(None, description="关联的知识库ID列表")
    avatar: Optional[str] = Field(None, description="Base64编码的头像")
    llm: Optional[LLMConfig] = Field(None, description="LLM配置")
    prompt: Optional[PromptConfig] = Field(None, description="提示配置")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "更新后的助手名称",
                "dataset_ids": ["dataset_id_1"],
                "llm": {
                    "temperature": 0.5
                }
            }
        }


class DeleteChatAssistantsRequest(BaseModel):
    """删除聊天助手请求"""
    ids: Optional[List[str]] = Field(None, description="要删除的助手ID列表")
    delete_all: Optional[bool] = Field(False, description="是否删除所有助手")

    class Config:
        json_schema_extra = {
            "example": {
                "ids": ["chat_id_1", "chat_id_2"]
            }
        }


class ListChatAssistantsParams(BaseModel):
    """列出聊天助手查询参数（仅文档说明用，实际由 Query 参数接收）"""
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(30, ge=1, le=10000, description="每页数量")
    orderby: Optional[str] = Field("create_time", description="排序字段: create_time / update_time")
    desc: Optional[bool] = Field(True, description="是否降序")
    name: Optional[str] = Field(None, description="按名称过滤")
    id: Optional[str] = Field(None, description="按ID过滤")


# ==================== 会话管理 - 新增请求模型 ====================

class UpdateSessionRequest(BaseModel):
    """更新会话请求"""
    name: str = Field(..., description="会话新名称（必填）")
    user_id: Optional[str] = Field(None, description="用户自定义ID")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "更新后的会话名称"
            }
        }


class DeleteSessionsRequest(BaseModel):
    """删除会话请求"""
    ids: Optional[List[str]] = Field(None, description="要删除的会话ID列表")
    delete_all: Optional[bool] = Field(False, description="是否删除该助手下所有会话")

    class Config:
        json_schema_extra = {
            "example": {
                "ids": ["session_id_1", "session_id_2"]
            }
        }


# ==================== 聊天助手管理 - 新增响应模型 ====================

class ListChatAssistantsResponse(BaseResponse):
    """列出聊天助手响应"""
    data: Optional[List[ChatAssistantInfo]] = None


class UpdateChatAssistantResponse(BaseResponse):
    """更新聊天助手响应（仅返回 code）"""
    pass


class DeleteChatAssistantsResponse(BaseResponse):
    """删除聊天助手响应（仅返回 code）"""
    pass


# ==================== 会话管理 - 新增响应模型 ====================

class ListSessionsResponse(BaseResponse):
    """列出会话响应"""
    data: Optional[List[SessionInfo]] = None


class UpdateSessionResponse(BaseResponse):
    """更新会话响应（仅返回 code）"""
    pass


class DeleteSessionsResponse(BaseResponse):
    """删除会话响应（仅返回 code）"""
    pass