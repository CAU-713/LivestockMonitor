"""
数据分析路由
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

from app.schemas.analysisDTO import (
    DataAnalysisRequest,
    DataAnalysisResponse,
    StatisticsResponse,
    CorrelationResponse,
    CleaningReport,
    HeatmapRequest,
    ACFAnalysisRequest
)
from app.services.analysis import DataAnalysisService
from app.config import settings

router = APIRouter(
    prefix="/api/data-analysis",
    tags=["Data Analysis"]
)

def get_analysis_service() -> DataAnalysisService:
    """获取数据分析服务实例"""
    db_url = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    return DataAnalysisService(db_url=db_url, output_dir="output/analysis")

@router.post("/analyze", response_model=DataAnalysisResponse)
async def analyze_data(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    完整数据分析流程

    包括：
    1. 数据加载
    2. 数据清洗
    3. 统计分析
    4. 相关性分析
    5. 保存结果
    """
    try:
        # 1. 加载数据
        data_info = service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 2. 数据清洗
        cleaning_report = service.clean_data()

        # 3. 统计分析
        statistics = service.calculate_statistics()

        # 4. 相关性分析
        correlation = service.calculate_correlation()

        # 5. 保存结果
        saved_files = service.save_results(prefix='enterprise_env')

        return DataAnalysisResponse(
            success=True,
            message="数据分析完成",
            data_info=data_info,
            cleaning_report=CleaningReport(**cleaning_report),
            statistics=statistics,
            correlation=CorrelationResponse(**correlation),
            files_generated=saved_files
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/statistics", response_model=List[StatisticsResponse])
async def get_statistics(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    获取统计分析结果
    """
    try:
        # 加载数据
        service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 数据清洗
        service.clean_data()

        # 计算统计量
        statistics = service.calculate_statistics()

        return statistics

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"统计分析失败: {str(e)}")


@router.post("/correlation", response_model=CorrelationResponse)
async def get_correlation(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    获取相关性分析结果
    """
    try:
        # 加载数据
        service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 数据清洗
        service.clean_data()

        # 计算相关性
        correlation = service.calculate_correlation()

        return CorrelationResponse(**correlation)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"相关性分析失败: {str(e)}")


@router.post("/heatmap")
async def generate_heatmap(
        request: HeatmapRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    生成相关系数热力图

    返回生成的图片文件
    """
    try:
        # 加载数据
        service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 数据清洗
        service.clean_data()

        # 生成热力图
        filepath = service.generate_heatmap()

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="热力图生成失败")

        return FileResponse(
            filepath,
            media_type="image/png",
            filename=os.path.basename(filepath)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"热力图生成失败: {str(e)}")


@router.post("/acf")
async def generate_acf_plot(
        request: ACFAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    生成ACF平稳性分析图

    返回生成的图片文件
    """
    try:
        # 加载数据
        service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 数据清洗
        service.clean_data()

        # 生成ACF图
        filepath = service.generate_acf_plot(
            columns=request.columns,
            lags=request.lags
        )

        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="ACF图生成失败")

        return FileResponse(
            filepath,
            media_type="image/png",
            filename=os.path.basename(filepath)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ACF分析失败: {str(e)}")


@router.post("/clean")
async def clean_data(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    数据清洗

    返回清洗报告
    """
    try:
        # 加载数据
        data_info = service.load_data_from_db(
            table_name=request.table_name,
            start_date=request.start_date,
            end_date=request.end_date,
            limit=request.limit
        )

        # 数据清洗
        cleaning_report = service.clean_data()

        return {
            "success": True,
            "data_info": data_info,
            "cleaning_report": cleaning_report
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"数据清洗失败: {str(e)}")


@router.get("/download/{filename}")
async def download_file(filename: str):
    """
    下载分析结果文件

    参数:
        filename: 文件名
    """
    filepath = os.path.join("output/analysis", filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="文件不存在")

    # 根据文件扩展名设置media_type
    if filename.endswith('.csv'):
        media_type = "text/csv"
    elif filename.endswith('.png'):
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        filepath,
        media_type=media_type,
        filename=filename
    )