from fastapi import APIRouter, HTTPException
from app.schemas.ragflowDTO import (
    DatasetCreate,
    DocumentUpload,
    DatasetListResponse
)
from app.services.ragflow_service import RAGFlowService
from typing import List

router = APIRouter(prefix="/api", tags=["dataset"])

# 初始化服务
ragflow_service = RAGFlowService()


@router.get("/datasets", response_model=List[DatasetListResponse])
async def list_datasets():
    """列出所有数据集"""
    try:
        datasets = ragflow_service.list_datasets()
        return {"success": True, "data": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets")
async def create_dataset(request: DatasetCreate):
    """创建数据集"""
    try:
        dataset_data = ragflow_service.create_dataset(
            name=request.name,
            description=request.description,
            chunk_method=request.chunk_method
        )
        return {"success": True, "data": dataset_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets/{dataset_id}/documents")
async def list_documents(dataset_id: str):
    """列出数据集中的文档"""
    try:
        documents = ragflow_service.list_documents(dataset_id)
        return {"success": True, "data": documents}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/datasets/{dataset_id}/documents")
async def upload_document(dataset_id: str, request: DocumentUpload):
    """上传文档到数据集"""
    try:
        result = ragflow_service.upload_document(
            dataset_id=dataset_id,
            display_name=request.display_name,
            content=request.content
        )
        return {"success": True, "message": result["message"]}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
