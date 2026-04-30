"""
批量导入路由
支持从 Excel/CSV 批量导入动物档案和体重记录
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import Response

from app.config import SessionDep
from app.schemas.responseDTO import ResponseDTO
from app.schemas.importDTO import ImportResultDTO
from app.services.import_service import ImportService

router = APIRouter(prefix="/api/import", tags=["批量导入"])


@router.post(
    "/animals",
    response_model=ResponseDTO[ImportResultDTO],
    summary="批量导入动物档案（支持 Excel/CSV）"
)
def import_animals(
    db: SessionDep,
    file: UploadFile = File(..., description="Excel(.xlsx) 或 CSV(.csv) 文件"),
) -> ResponseDTO[ImportResultDTO]:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请上传文件")
    allowed_ext = (".xlsx", ".xls", ".csv")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 .xlsx、.xls 或 .csv 格式文件"
        )

    file_bytes = file.file.read()
    result = ImportService.import_animals(db, file_bytes, file.filename)
    msg = f"导入完成：成功 {result.success_count} 条，失败 {result.fail_count} 条"
    return ResponseDTO(code=200, success=True, message=msg, data=result)


@router.get(
    "/template/animals",
    summary="下载动物档案导入模板（xlsx）"
)
def download_animal_template() -> Response:
    file_bytes = ImportService.generate_animal_template()
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=animal_import_template.xlsx"}
    )


@router.post(
    "/health/weight",
    response_model=ResponseDTO[ImportResultDTO],
    summary="批量导入体重记录（支持 Excel/CSV）"
)
def import_weight_records(
    db: SessionDep,
    file: UploadFile = File(..., description="Excel(.xlsx) 或 CSV(.csv) 文件"),
) -> ResponseDTO[ImportResultDTO]:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请上传文件")
    allowed_ext = (".xlsx", ".xls", ".csv")
    if not any(file.filename.lower().endswith(ext) for ext in allowed_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 .xlsx、.xls 或 .csv 格式文件"
        )

    file_bytes = file.file.read()
    result = ImportService.import_weight_records(db, file_bytes, file.filename)
    msg = f"导入完成：成功 {result.success_count} 条，失败 {result.fail_count} 条"
    return ResponseDTO(code=200, success=True, message=msg, data=result)


@router.get(
    "/template/weight",
    summary="下载体重记录导入模板（xlsx）"
)
def download_weight_template() -> Response:
    file_bytes = ImportService.generate_weight_template()
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=weight_import_template.xlsx"}
    )
