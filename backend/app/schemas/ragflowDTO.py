"""
RAGFlow 数据传输对象 (DTO)
定义 RAGFlow API 接口的请求和响应格式
"""
from typing import Optional, List

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """聊天请求 DTO"""
    question: str = Field(..., description="用户提问内容")
    session_id: Optional[str] = Field(None, description="会话 ID，如果为空则创建新会话")
    chat_id: str = Field(..., description="RAGFlow 聊天助手 ID")
    stream: bool = Field(False, description="是否使用流式响应")


class Reference(BaseModel):
    """引用信息 DTO"""
    content: str = Field("", description="引用的内容片段")
    document_name: str = Field("未知文档", description="来源文档名称")
    document_id: str = Field("", description="文档 ID")
    similarity: float = Field(0, description="相似度评分")
    dataset_id: str = Field("", description="数据集 ID")


class ChatData(BaseModel):
    """聊天响应数据 DTO"""
    answer: str = Field(..., description="AI 回答内容")
    session_id: str = Field(..., description="会话 ID")
    references: Optional[List[Reference]] = Field(None, description="引用的文档片段列表")


class ChatResponse(BaseModel):
    """聊天响应 DTO"""
    success: bool = Field(True, description="请求是否成功")
    data: ChatData = Field(..., description="响应数据")


class SessionCreate(BaseModel):
    """创建会话请求 DTO"""
    chat_id: str = Field(..., description="聊天助手 ID")
    session_name: Optional[str] = Field("New Session", description="会话名称")


class SessionData(BaseModel):
    """会话数据 DTO"""
    session_id: str = Field(..., description="会话 ID")
    session_name: str = Field(..., description="会话名称")
    chat_id: str = Field(..., description="关联的聊天助手 ID")


class SessionResponse(BaseModel):
    """会话响应 DTO"""
    success: bool = Field(True, description="请求是否成功")
    data: SessionData = Field(..., description="会话数据")


class DatasetCreate(BaseModel):
    """创建数据集请求 DTO"""
    name: str = Field(..., description="数据集名称")
    description: Optional[str] = Field(None, description="数据集描述")
    chunk_method: str = Field("naive", description="文档分块方法")


class DatasetData(BaseModel):
    """数据集数据 DTO"""
    id: str = Field(..., description="数据集 ID")
    name: str = Field(..., description="数据集名称")


class DatasetResponse(BaseModel):
    """数据集响应 DTO"""
    success: bool = Field(True, description="请求是否成功")
    data: DatasetData = Field(..., description="数据集数据")


class DocumentUpload(BaseModel):
    """上传文档请求 DTO"""
    display_name: str = Field(..., description="文档显示名称")
    content: str = Field(..., description="文档内容（Base64 编码或纯文本）")