"""
数据分析路由
"""

import io

from app.config import settings
from app.schemas.analysisDTO import (
    DataAnalysisRequest,
    DataAnalysisResponse,
    StatisticsResponse,
    CorrelationResponse,
    CleaningReport,
    HeatmapRequest,
    HeatmapResponse,
    ACFAnalysisRequest,
    ACFAnalysisResponse,
    ExportDataRequest
)
from app.schemas.responseDTO import ResponseDTO
from app.services.analysis import DataAnalysisService
from app.utils.response import success, error, server_error
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

router = APIRouter(
    prefix="/api/data-analysis",
    tags=["Data Analysis"]
)


def get_analysis_service() -> DataAnalysisService:
    """获取数据分析服务实例"""
    db_url = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    return DataAnalysisService(db_url=db_url)


@router.post("/analyze")
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

    所有结果直接返回，不保存本地文件
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

        response_data = {
            "data_info": data_info,
            "cleaning_report": cleaning_report,
            "statistics": statistics,
            "correlation": correlation
        }

        return success(data=response_data, message="数据分析完成")

    except Exception as e:
        return server_error(message=f"分析失败: {str(e)}")


@router.post("/statistics")
async def get_statistics(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    获取统计分析结果

    返回各变量的统计指标（均值、方差、标准差等）
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

        return success(data=statistics, message="统计分析完成")

    except Exception as e:
        return server_error(message=f"统计分析失败: {str(e)}")


@router.post("/correlation")
async def get_correlation(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    获取相关性分析结果

    返回Pearson相关系数矩阵和强相关变量对
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

        return success(data=correlation, message="相关性分析完成")

    except Exception as e:
        return server_error(message=f"相关性分析失败: {str(e)}")


@router.post("/heatmap")
async def generate_heatmap(
        request: HeatmapRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    生成相关系数热力图

    返回Base64编码的PNG图片
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

        # 生成热力图（Base64）
        image_base64 = service.generate_heatmap_base64()

        heatmap_data = {
            "image_base64": image_base64,
            "format": "png",
            "description": "Pearson Correlation Heatmap"
        }

        return success(data=heatmap_data, message="热力图生成完成")

    except Exception as e:
        return server_error(message=f"热力图生成失败: {str(e)}")


@router.post("/acf")
async def generate_acf_plot(
        request: ACFAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    生成ACF平稳性分析图

    返回Base64编码的PNG图片
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

        # 生成ACF图（Base64）
        image_base64 = service.generate_acf_plot_base64(
            columns=request.columns,
            lags=request.lags
        )

        # 确定实际分析的列
        if request.columns:
            analyzed_columns = request.columns
        else:
            # 默认列
            default_cols = [
                'indoor_temperature', 'outdoor_temperature', 'indoor_humidity',
                'temperature_sensor_1', 'temperature_sensor_2', 'variable_speed_fan_1'
            ]
            analyzed_columns = [col for col in default_cols if col in service.df.columns]

        acf_data = {
            "image_base64": image_base64,
            "format": "png",
            "description": "ACF Stationarity Analysis",
            "columns_analyzed": analyzed_columns
        }

        return success(data=acf_data, message="ACF分析完成")

    except Exception as e:
        return server_error(message=f"ACF分析失败: {str(e)}")


@router.post("/clean")
async def clean_data(
        request: DataAnalysisRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    数据清洗

    返回清洗报告和数据信息
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

        clean_result = {
            "data_info": data_info,
            "cleaning_report": cleaning_report
        }

        return success(data=clean_result, message="数据清洗完成")

    except Exception as e:
        return server_error(message=f"数据清洗失败: {str(e)}")


@router.post("/export/csv")
async def export_csv(
        request: ExportDataRequest,
        service: DataAnalysisService = Depends(get_analysis_service)
):
    """
    导出CSV数据

    支持导出：
    - cleaned: 清洗后的原始数据
    - statistics: 统计分析结果
    - correlation: 相关系数矩阵

    返回CSV文件流，前端可直接下载

    注意：此接口返回文件流，不使用统一响应格式
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

        # 根据类型导出不同的CSV
        if request.data_type == 'cleaned':
            csv_content = service.get_cleaned_data_csv()
            filename = f"cleaned_data_{request.table_name}.csv"
        elif request.data_type == 'statistics':
            csv_content = service.get_statistics_csv()
            filename = f"statistics_{request.table_name}.csv"
        elif request.data_type == 'correlation':
            csv_content = service.get_correlation_csv()
            filename = f"correlation_{request.table_name}.csv"
        else:
            raise ValueError(f"Invalid data_type: {request.data_type}")

        # 返回CSV文件流
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except Exception as e:
        # CSV导出失败时抛出HTTP异常
        raise HTTPException(
            status_code=500,
            detail=f"导出CSV失败: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    健康检查接口
    """
    health_data = {
        "status": "healthy",
        "service": "data-analysis",
        "version": "2.0.0",
        "features": [
            "statistics",
            "correlation",
            "heatmap (base64)",
            "acf (base64)",
            "csv export (streaming)"
        ]
    }

    return success(data=health_data, message="服务运行正常")