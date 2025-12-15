from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.ragflowDTO import (
    ChatRequest,
    ChatResponse,
    SessionCreate,
    ChatListResponse
)
from app.services.ragflow_service import RAGFlowService
from typing import List
import traceback

router = APIRouter(prefix="/api", tags=["chat"])

# 初始化服务
ragflow_service = RAGFlowService()


@router.get("/chats", response_model=List[ChatListResponse])
async def list_chats():
    """列出所有聊天助手"""
    try:
        chats = ragflow_service.list_chats()
        return {"success": True, "data": chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions")
async def create_session(request: SessionCreate):
    """创建新会话"""
    try:
        session_data = ragflow_service.create_session(
            chat_id=request.chat_id,
            session_name=request.session_name
        )
        return {"success": True, "data": session_data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat(request: ChatRequest):
    """非流式聊天"""
    try:
        response_data = ragflow_service.chat(
            question=request.question,
            chat_id=request.chat_id,
            session_id=request.session_id
        )
        return {"success": True, "data": response_data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        error_detail = traceback.format_exc()
        print(f"Chat error: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """流式聊天"""
    try:
        return StreamingResponse(
            ragflow_service.chat_stream(
                question=request.question,
                chat_id=request.chat_id,
                session_id=request.session_id
            ),
            media_type="text/event-stream"
        )
    except Exception as e:
        error_detail = traceback.format_exc()
        print(f"Stream error: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))
