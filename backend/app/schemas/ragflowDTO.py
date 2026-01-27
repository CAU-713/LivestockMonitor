"""
RAGFlow API Models
数据模型定义，用于请求验证和响应序列化
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
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
    chunk_method: str
    created_by: str
    create_date: str
    status: str


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
    """聊天助手信息"""
    id: str
    name: str
    avatar: Optional[str] = None
    dataset_ids: List[str]
    llm: Dict[str, Any]
    prompt: Dict[str, Any]
    create_date: str
    update_date: str


class CreateChatAssistantResponse(BaseResponse):
    """创建聊天助手响应"""
    data: Optional[ChatAssistantInfo] = None


class SessionInfo(BaseModel):
    """会话信息"""
    id: str
    chat_id: str
    name: str
    messages: List[Dict[str, str]]
    create_date: str
    update_date: str


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