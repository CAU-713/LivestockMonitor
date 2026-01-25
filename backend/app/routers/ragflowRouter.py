"""
RAGFlow 聊天路由
提供 RAGFlow 相关的 API 接口
"""
from app.schemas.ragflowDTO import (
    ChatRequest, ChatResponse, SessionCreate, SessionResponse,
    DatasetCreate, DatasetResponse, DocumentUpload
)
from app.services.ragflow import RAGFlowService
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/ragflow", tags=["RAGFlow Chat"])

# 初始化 RAGFlow 服务
ragflow_service = RAGFlowService()


@router.get("/chats")
async def list_chats():
    """
    列出所有聊天助手

    Returns:
        包含所有聊天助手信息的列表
    """
    try:
        chats = ragflow_service.list_chats()
        return {
            "success": True,
            "data": chats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: SessionCreate):
    """
    创建新会话

    Args:
        request: 包含 chat_id 和可选 session_name 的请求

    Returns:
        新创建的会话信息
    """
    try:
        session_data = ragflow_service.create_session(
            chat_id=request.chat_id,
            session_name=request.session_name
        )
        return SessionResponse(success=True, data=session_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    非流式聊天接口

    Args:
        request: 包含问题、会话 ID、聊天助手 ID 的请求

    Returns:
        聊天响应，包含答案和引用信息
    """
    try:
        response_data = ragflow_service.chat(
            question=request.question,
            chat_id=request.chat_id,
            session_id=request.session_id
        )
        return ChatResponse(success=True, data=response_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    流式聊天接口

    Args:
        request: 包含问题、会话 ID、聊天助手 ID 的请求

    Returns:
        Server-Sent Events 流式响应
    """
    try:
        generator = ragflow_service.chat_stream(
            question=request.question,
            chat_id=request.chat_id,
            session_id=request.session_id
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets")
async def list_datasets():
    """
    列出所有数据集

    Returns:
        所有数据集的列表
    """
    try:
        datasets = ragflow_service.list_datasets()
        return {
            "success": True,
            "data": datasets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets", response_model=DatasetResponse)
async def create_dataset(request: DatasetCreate):
    """
    创建新数据集

    Args:
        request: 包含数据集名称、描述和分块方法的请求

    Returns:
        新创建的数据集信息
    """
    try:
        dataset_data = ragflow_service.create_dataset(
            name=request.name,
            description=request.description,
            chunk_method=request.chunk_method
        )
        return DatasetResponse(success=True, data=dataset_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_id}/documents")
async def list_documents(dataset_id: str):
    """
    列出数据集中的文档

    Args:
        dataset_id: 数据集 ID

    Returns:
        数据集中所有文档的列表
    """
    try:
        documents = ragflow_service.list_documents(dataset_id)
        return {
            "success": True,
            "data": documents
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/documents")
async def upload_document(dataset_id: str, request: DocumentUpload):
    """
    上传文档到数据集

    Args:
        dataset_id: 数据集 ID
        request: 包含文档名称和内容的请求

    Returns:
        上传成功的消息
    """
    try:
        ragflow_service.upload_document(
            dataset_id=dataset_id,
            display_name=request.display_name,
            content=request.content
        )
        return {
            "success": True,
            "message": "Document uploaded successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))