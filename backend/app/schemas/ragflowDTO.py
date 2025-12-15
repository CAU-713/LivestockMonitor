from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    """聊天请求模型"""
    question: str = Field(..., description="用户问题")
    session_id: Optional[str] = Field(None, description="会话ID")
    chat_id: str = Field(..., description="聊天助手ID")
    stream: bool = Field(False, description="是否流式输出")


class ReferenceDTO(BaseModel):
    """引用信息模型"""
    content: str = Field(..., description="引用内容")
    document_name: str = Field(..., description="文档名称")
    document_id: Optional[str] = Field(None, description="文档ID")
    similarity: float = Field(..., description="相似度分数")
    dataset_id: Optional[str] = Field(None, description="数据集ID")


class ChatResponse(BaseModel):
    """聊天响应模型"""
    answer: str = Field(..., description="回答内容")
    session_id: str = Field(..., description="会话ID")
    references: Optional[List[ReferenceDTO]] = Field(None, description="参考来源")


class SessionCreate(BaseModel):
    """创建会话请求"""
    chat_id: str = Field(..., description="聊天助手ID")
    session_name: Optional[str] = Field("New Session", description="会话名称")


class DatasetCreate(BaseModel):
    """创建数据集请求"""
    name: str = Field(..., description="数据集名称")
    description: Optional[str] = Field(None, description="数据集描述")
    chunk_method: str = Field("naive", description="分块方法")


class DocumentUpload(BaseModel):
    """上传文档请求"""
    dataset_id: str = Field(..., description="数据集ID")
    display_name: str = Field(..., description="文档显示名称")
    content: str = Field(..., description="文档内容（Base64或文本）")


class ChatListResponse(BaseModel):
    """聊天助手列表响应"""
    id: str
    name: str
    description: Optional[str] = None


class DatasetListResponse(BaseModel):
    """数据集列表响应"""
    id: str
    name: str
    chunk_count: int
    document_count: int