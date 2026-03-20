"""
RAGFlow Router Layer
路由层，定义所有API端点
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
import tempfile
import os

from app.schemas.ragflowDTO import (
    CreateDatasetRequest, CreateDatasetResponse,
    ParseDocumentsRequest, ParseDocumentsResponse,
    DeleteDocumentsRequest, DeleteDocumentsResponse,
    CreateChatAssistantRequest, CreateChatAssistantResponse,
    CreateSessionRequest, CreateSessionResponse,
    UploadDocumentsResponse, ErrorResponse, ChatCompletionRequest,
    UpdateChatAssistantRequest, UpdateChatAssistantResponse,
    DeleteChatAssistantsRequest, DeleteChatAssistantsResponse,
    ListChatAssistantsResponse,
    UpdateSessionRequest, UpdateSessionResponse,
    DeleteSessionsRequest, DeleteSessionsResponse,
    ListSessionsResponse,
)
from app.services.ragflow import RAGFlowService, RAGFlowServiceError

logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(
    prefix="/api/ragflow",
    tags=["RAGFlow"],
    responses={
        500: {"model": ErrorResponse, "description": "服务器内部错误"},
        400: {"model": ErrorResponse, "description": "请求参数错误"},
    }
)


# 依赖注入：获取RAGFlow服务实例
def get_ragflow_service() -> RAGFlowService:
    """
    获取RAGFlow服务实例
    在实际应用中，应该从配置文件或环境变量中读取
    """
    # 从配置中读取
    base_url = os.getenv("RAGFLOW_BASE_URL")
    api_key = os.getenv("RAGFLOW_API_KEY")

    return RAGFlowService(base_url=base_url, api_key=api_key)


@router.post(
    "/datasets",
    response_model=CreateDatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建知识库",
    description="创建一个新的知识库（数据集）"
)
async def create_dataset(
        request: CreateDatasetRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    创建知识库

    - **name**: 知识库名称（必填）
    - **description**: 知识库描述
    - **chunk_method**: 分块方法（naive, book, email等）
    - **parser_config**: 解析器配置
    """
    try:
        logger.info(f"接收到创建知识库请求: {request.name}")

        result = service.create_dataset(
            name=request.name,
            avatar=request.avatar,
            description=request.description,
            embedding_model=request.embedding_model,
            permission=request.permission.value if request.permission else "me",
            chunk_method=request.chunk_method.value if request.chunk_method else None,
            parser_config=request.parser_config,
            parse_type=request.parse_type,
            pipeline_id=request.pipeline_id
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"创建知识库失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("创建知识库时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.post(
    "/datasets/{dataset_id}/documents",
    response_model=UploadDocumentsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="上传文档",
    description="上传一个或多个文档到指定知识库"
)
async def upload_documents(
        dataset_id: str,
        files: List[UploadFile] = File(..., description="要上传的文件列表"),
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    上传文档到知识库

    修复：临时文件以原始文件名命名，确保 RAGFlow 存储正确的文档名称。
    """
    temp_file_paths = []

    try:
        logger.info(f"接收到上传文档请求: 知识库={dataset_id}, 文件数={len(files)}")

        file_paths = []
        for upload_file in files:
            # ✅ 修复：使用原始文件名，而不是随机的 tmpXXXXX 名称
            original_filename = upload_file.filename or "unknown_file"

            # 清理文件名中的路径分隔符（防止路径注入）
            safe_filename = os.path.basename(original_filename)

            # 在系统临时目录下创建以原始文件名命名的临时文件
            temp_dir = tempfile.gettempdir()
            temp_file_path = os.path.join(temp_dir, safe_filename)

            # 若同名文件已存在，加随机前缀避免冲突
            if os.path.exists(temp_file_path):
                name, ext = os.path.splitext(safe_filename)
                import uuid
                temp_file_path = os.path.join(
                    temp_dir,
                    f"{name}_{uuid.uuid4().hex[:8]}{ext}"
                )

            # 写入文件内容
            content = await upload_file.read()
            with open(temp_file_path, 'wb') as f:
                f.write(content)

            temp_file_paths.append(temp_file_path)
            logger.debug(f"文件已保存到临时路径: {temp_file_path} (原始名: {safe_filename})")
            file_paths.append(temp_file_path)

        # 调用服务层上传
        result = service.upload_documents(
            dataset_id=dataset_id,
            file_paths=file_paths
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"上传文档失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("上传文档时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )
    finally:
        # 清理所有临时文件
        for temp_path in temp_file_paths:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                    logger.debug(f"临时文件已删除: {temp_path}")
            except Exception as e:
                logger.warning(f"删除临时文件失败: {temp_path}, 错误: {e}")


@router.post(
    "/datasets/{dataset_id}/parse",
    response_model=ParseDocumentsResponse,
    summary="解析文档",
    description="解析知识库中的指定文档"
)
async def parse_documents(
        dataset_id: str,
        request: ParseDocumentsRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    解析文档

    - **dataset_id**: 知识库ID（路径参数）
    - **document_ids**: 要解析的文档ID列表
    """
    try:
        logger.info(f"接收到解析文档请求: 知识库={dataset_id}, 文档数={len(request.document_ids)}")

        result = service.parse_documents(
            dataset_id=dataset_id,
            document_ids=request.document_ids
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"解析文档失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("解析文档时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.delete(
    "/datasets/{dataset_id}/documents",
    response_model=DeleteDocumentsResponse,
    summary="删除文档",
    description="删除知识库中的指定文档或所有文档"
)
async def delete_documents(
        dataset_id: str,
        request: Optional[DeleteDocumentsRequest] = None,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    删除文档

    - **dataset_id**: 知识库ID（路径参数）
    - **ids**: 要删除的文档ID列表（可选，为空则删除所有文档）
    """
    try:
        document_ids = request.ids if request else None
        logger.info(f"接收到删除文档请求: 知识库={dataset_id}, 文档ID={document_ids}")

        result = service.delete_documents(
            dataset_id=dataset_id,
            document_ids=document_ids
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"删除文档失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("删除文档时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.post(
    "/chat-assistants",
    response_model=CreateChatAssistantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建聊天助手",
    description="创建一个新的聊天助手"
)
async def create_chat_assistant(
        request: CreateChatAssistantRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    创建聊天助手

    - **name**: 助手名称（必填）
    - **dataset_ids**: 关联的知识库ID列表
    - **llm**: LLM配置（模型、温度等参数）
    - **prompt**: 提示配置（相似度阈值、开场白等）
    """
    try:
        logger.info(f"接收到创建聊天助手请求: {request.name}")

        # 转换LLM配置
        llm_config = None
        if request.llm:
            llm_config = request.llm.dict(exclude_none=True)

        # 转换Prompt配置
        prompt_config = None
        if request.prompt:
            prompt_config = request.prompt.dict(exclude_none=True)

        result = service.create_chat_assistant(
            name=request.name,
            dataset_ids=request.dataset_ids,
            avatar=request.avatar,
            llm=llm_config,
            prompt=prompt_config
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"创建聊天助手失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("创建聊天助手时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.post(
    "/chat-assistants/{chat_id}/sessions",
    response_model=CreateSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="创建会话",
    description="为指定的聊天助手创建一个新的会话"
)
async def create_session(
        chat_id: str,
        request: CreateSessionRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    创建会话

    - **chat_id**: 聊天助手ID（路径参数）
    - **name**: 会话名称
    - **user_id**: 用户自定义ID
    """
    try:
        logger.info(f"接收到创建会话请求: 助手={chat_id}, 名称={request.name}")

        result = service.create_session(
            chat_id=chat_id,
            name=request.name,
            user_id=request.user_id
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"创建会话失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("创建会话时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


# ==================== 扩展功能 ====================

# @router.get(
#     "/datasets/{dataset_id}",
#     summary="获取知识库详情",
#     description="获取指定知识库的详细信息"
# )
# async def get_dataset_info(
#         dataset_id: str,
#         service: RAGFlowService = Depends(get_ragflow_service)
# ):
#     """
#     获取知识库详情
#
#     - **dataset_id**: 知识库ID（路径参数）
#     """
#     try:
#         logger.info(f"接收到获取知识库详情请求: {dataset_id}")
#         result = service.get_dataset_info(dataset_id)
#         return result
#     except RAGFlowServiceError as e:
#         logger.error(f"获取知识库详情失败: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )
#     except Exception as e:
#         logger.exception("获取知识库详情时发生未知错误")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"服务器内部错误: {str(e)}"
#         )


@router.get(
    "/datasets",
    summary="列出所有知识库",
    description="分页获取所有知识库列表"
)
async def list_datasets(
        page: int = 1,
        page_size: int = 10,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    列出所有知识库

    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认10）
    """
    try:
        logger.info(f"接收到列出知识库请求: page={page}, page_size={page_size}")
        result = service.list_datasets(page=page, page_size=page_size)
        return result
    except RAGFlowServiceError as e:
        logger.error(f"列出知识库失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("列出知识库时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


# ==================== 文档状态查询相关端点 ====================

@router.get(
    "/datasets/{dataset_id}/documents/{document_id}/status",
    summary="查询文档解析状态",
    description="查询指定文档的解析状态"
)
async def get_document_status(
        dataset_id: str,
        document_id: str,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    查询文档解析状态

    - **dataset_id**: 知识库ID（路径参数）
    - **document_id**: 文档ID（路径参数）

    返回状态可能的值：
    - UNSTART: 未开始
    - RUNNING: 解析中
    - CANCEL: 已取消
    - DONE: 解析完成
    - FAIL: 解析失败
    """
    try:
        logger.info(f"接收到查询文档状态请求: dataset={dataset_id}, document={document_id}")

        status_value = service.get_document_status(
            document_id=document_id,
            dataset_id=dataset_id
        )

        if status_value is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到文档: {document_id}"
            )

        return {
            "code": 0,
            "data": {
                "document_id": document_id,
                "dataset_id": dataset_id,
                "status": status_value
            }
        }

    except RAGFlowServiceError as e:
        logger.error(f"查询文档状态失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("查询文档状态时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.get(
    "/datasets/{dataset_id}/documents",
    summary="获取文档列表",
    description="获取知识库中的文档列表，支持按状态过滤"
)
async def get_documents_list(
        dataset_id: str,
        page: int = 1,
        page_size: int = 10,
        status_filter: Optional[str] = None,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    获取文档列表

    - **dataset_id**: 知识库ID（路径参数）
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认10）
    - **status_filter**: 状态过滤（可选），多个状态用逗号分隔，如: "DONE,RUNNING"
    """
    try:
        logger.info(f"接收到获取文档列表请求: dataset={dataset_id}, page={page}")

        # 处理状态过滤
        status_list = None
        if status_filter:
            status_list = [s.strip().upper() for s in status_filter.split(',')]

        result = service.get_documents_list(
            dataset_id=dataset_id,
            page=page,
            page_size=page_size,
            status_filter=status_list
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"获取文档列表失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("获取文档列表时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.get(
    "/datasets/{dataset_id}/ready",
    summary="检查知识库就绪状态",
    description="检查知识库是否已准备好（所有文档都已解析完成）"
)
async def check_dataset_ready(
        dataset_id: str,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    检查知识库就绪状态

    - **dataset_id**: 知识库ID（路径参数）

    返回信息包括：
    - ready: 是否已就绪（所有文档都解析完成）
    - total: 总文档数
    - done: 已完成数
    - running: 解析中数
    - failed: 失败数
    - documents: 文档状态详情列表
    """
    try:
        logger.info(f"接收到检查知识库就绪状态请求: dataset={dataset_id}")

        result = service.check_dataset_ready(dataset_id=dataset_id)

        return {
            "code": 0,
            "data": result
        }

    except RAGFlowServiceError as e:
        logger.error(f"检查知识库就绪状态失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("检查知识库就绪状态时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


# ==================== 聊天对话端点 ====================

@router.post(
    "/chat-assistants/{chat_id}/completions",
    summary="与聊天助手对话",
    description="向聊天助手提问并获取响应（支持流式和非流式）"
)
async def chat_with_assistant(
        chat_id: str,
        request: ChatCompletionRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    与聊天助手对话

    - **chat_id**: 聊天助手ID（路径参数）
    - **question**: 用户问题（必填）
    - **stream**: 是否使用流式输出（默认True）
    - **session_id**: 会话ID（可选，不提供则创建新会话）
    - **user_id**: 用户自定义ID（可选）
    - **metadata_condition**: 元数据过滤条件（可选）

    流式响应说明：
    - 使用 Server-Sent Events (SSE) 格式
    - 每次更新返回增量内容
    - 最后一条消息为 {"code": 0, "data": true}

    非流式响应：
    - 返回完整的答案和引用信息
    """
    try:
        logger.info(f"接收到对话请求: chat_id={chat_id}, question={request.question[:50]}")

        # 准备元数据过滤条件
        metadata_condition = None
        if request.metadata_condition:
            metadata_condition = request.metadata_condition.dict()

        if request.stream:
            # 流式响应
            from fastapi.responses import StreamingResponse

            def generate():
                try:
                    result = service.chat_with_assistant(
                        chat_id=chat_id,
                        question=request.question,
                        session_id=request.session_id,
                        stream=True,
                        user_id=request.user_id,
                        metadata_condition=metadata_condition
                    )

                    for data in result:
                        import json
                        yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

                except Exception as e:
                    logger.error(f"流式对话异常: {e}")
                    error_data = {
                        "code": 500,
                        "message": str(e)
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"

            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        else:
            # 非流式响应
            result = service.chat_with_assistant(
                chat_id=chat_id,
                question=request.question,
                session_id=request.session_id,
                stream=False,
                user_id=request.user_id,
                metadata_condition=metadata_condition
            )

            return result

    except RAGFlowServiceError as e:
        logger.error(f"对话失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("对话时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )

"""
RAGFlow Router 补充代码
"""

# ==================== 聊天助手管理 ====================

@router.put(
    "/chat-assistants/{chat_id}",
    response_model=UpdateChatAssistantResponse,
    summary="更新聊天助手",
    description="更新指定聊天助手的配置信息"
)
async def update_chat_assistant(
        chat_id: str,
        request: UpdateChatAssistantRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    更新聊天助手

    - **chat_id**: 聊天助手ID（路径参数）
    - **name**: 助手新名称（必填）
    - **dataset_ids**: 关联的知识库ID列表
    - **llm**: LLM配置
    - **prompt**: 提示配置
    """
    try:
        logger.info(f"接收到更新聊天助手请求: chat_id={chat_id}, name={request.name}")

        llm_config = request.llm.dict(exclude_none=True) if request.llm else None
        prompt_config = request.prompt.dict(exclude_none=True) if request.prompt else None

        result = service.update_chat_assistant(
            chat_id=chat_id,
            name=request.name,
            dataset_ids=request.dataset_ids,
            avatar=request.avatar,
            llm=llm_config,
            prompt=prompt_config
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"更新聊天助手失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("更新聊天助手时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.delete(
    "/chat-assistants",
    response_model=DeleteChatAssistantsResponse,
    summary="删除聊天助手",
    description="批量删除聊天助手，或删除当前用户所有聊天助手"
)
async def delete_chat_assistants(
        request: DeleteChatAssistantsRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    删除聊天助手

    - **ids**: 要删除的助手ID列表（与 delete_all 二选一）
    - **delete_all**: 是否删除所有助手（ids 为空时生效）
    """
    try:
        logger.info(f"接收到删除聊天助手请求: ids={request.ids}, delete_all={request.delete_all}")

        result = service.delete_chat_assistants(
            ids=request.ids,
            delete_all=request.delete_all or False
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"删除聊天助手失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("删除聊天助手时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.get(
    "/chat-assistants",
    response_model=ListChatAssistantsResponse,
    summary="列出聊天助手",
    description="分页获取聊天助手列表，支持按名称或ID过滤"
)
async def list_chat_assistants(
        page: int = 1,
        page_size: int = 30,
        orderby: str = "create_time",
        desc: bool = True,
        name: Optional[str] = None,
        chat_id: Optional[str] = None,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    列出聊天助手

    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认30）
    - **orderby**: 排序字段，可选 create_time / update_time
    - **desc**: 是否降序（默认True）
    - **name**: 按助手名称过滤（可选）
    - **chat_id**: 按助手ID过滤（可选）
    """
    try:
        logger.info(f"接收到列出聊天助手请求: page={page}, page_size={page_size}")

        result = service.list_chat_assistants(
            page=page,
            page_size=page_size,
            orderby=orderby,
            desc=desc,
            name=name,
            chat_id=chat_id
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"列出聊天助手失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("列出聊天助手时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


# ==================== 会话管理 ====================

@router.put(
    "/chat-assistants/{chat_id}/sessions/{session_id}",
    response_model=UpdateSessionResponse,
    summary="更新会话",
    description="更新指定聊天助手的会话名称"
)
async def update_session(
        chat_id: str,
        session_id: str,
        request: UpdateSessionRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    更新会话

    - **chat_id**: 聊天助手ID（路径参数）
    - **session_id**: 会话ID（路径参数）
    - **name**: 会话新名称（必填）
    - **user_id**: 用户自定义ID（可选）
    """
    try:
        logger.info(f"接收到更新会话请求: chat_id={chat_id}, session_id={session_id}")

        result = service.update_session(
            chat_id=chat_id,
            session_id=session_id,
            name=request.name,
            user_id=request.user_id
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"更新会话失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("更新会话时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.get(
    "/chat-assistants/{chat_id}/sessions",
    response_model=ListSessionsResponse,
    summary="列出会话",
    description="分页获取指定聊天助手的会话列表，支持按名称、ID或用户ID过滤"
)
async def list_sessions(
        chat_id: str,
        page: int = 1,
        page_size: int = 30,
        orderby: str = "create_time",
        desc: bool = True,
        name: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    列出会话

    - **chat_id**: 聊天助手ID（路径参数）
    - **page**: 页码（默认1）
    - **page_size**: 每页数量（默认30）
    - **orderby**: 排序字段，可选 create_time / update_time
    - **desc**: 是否降序（默认True）
    - **name**: 按会话名称过滤（可选）
    - **session_id**: 按会话ID过滤（可选）
    - **user_id**: 按用户自定义ID过滤（可选）
    """
    try:
        logger.info(f"接收到列出会话请求: chat_id={chat_id}, page={page}, page_size={page_size}")

        result = service.list_sessions(
            chat_id=chat_id,
            page=page,
            page_size=page_size,
            orderby=orderby,
            desc=desc,
            name=name,
            session_id=session_id,
            user_id=user_id
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"列出会话失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("列出会话时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )


@router.delete(
    "/chat-assistants/{chat_id}/sessions",
    response_model=DeleteSessionsResponse,
    summary="删除会话",
    description="批量删除指定聊天助手的会话，或删除该助手下所有会话"
)
async def delete_sessions(
        chat_id: str,
        request: DeleteSessionsRequest,
        service: RAGFlowService = Depends(get_ragflow_service)
):
    """
    删除会话

    - **chat_id**: 聊天助手ID（路径参数）
    - **ids**: 要删除的会话ID列表（与 delete_all 二选一）
    - **delete_all**: 是否删除该助手下所有会话（ids 为空时生效）
    """
    try:
        logger.info(f"接收到删除会话请求: chat_id={chat_id}, ids={request.ids}, delete_all={request.delete_all}")

        result = service.delete_sessions(
            chat_id=chat_id,
            ids=request.ids,
            delete_all=request.delete_all or False
        )

        return result

    except RAGFlowServiceError as e:
        logger.error(f"删除会话失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception("删除会话时发生未知错误")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"服务器内部错误: {str(e)}"
        )