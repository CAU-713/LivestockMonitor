"""
数据分析相关的 DTO
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class DataAnalysisRequest(BaseModel):
    """数据分析请求"""
    table_name: str = Field(default='enterprise_fattening_environment', description="数据表名")
    start_date: Optional[str] = Field(None, description="起始日期 (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="结束日期 (YYYY-MM-DD)")
    limit: Optional[int] = Field(None, description="限制读取行数")

    class Config:
        json_schema_extra = {
            "example": {
                "table_name": "enterprise_fattening_environment",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
                "limit": 10000
            }
        }


class StatisticsResponse(BaseModel):
    """统计分析响应"""
    variable: str
    mean: float
    variance: float
    std: float
    min: float
    max: float
    count: int


class CorrelationPair(BaseModel):
    """相关性对"""
    variable1: str
    variable2: str
    correlation: float
    relation: str  # "positive" or "negative"


class CorrelationResponse(BaseModel):
    """相关性分析响应"""
    correlation_matrix: Dict[str, Dict[str, float]]
    strong_correlations: List[CorrelationPair]


class CleaningReport(BaseModel):
    """数据清洗报告"""
    outliers_detected: int
    outliers_replaced: int
    missing_before: int
    missing_after: int
    missing_filled: int


class DataAnalysisResponse(BaseModel):
    """完整数据分析响应"""
    success: bool
    message: str
    data_info: Dict[str, Any]
    cleaning_report: Optional[CleaningReport] = None
    statistics: Optional[List[StatisticsResponse]] = None
    correlation: Optional[CorrelationResponse] = None
    files_generated: Optional[List[str]] = None


class HeatmapRequest(BaseModel):
    """热力图生成请求"""
    table_name: str = Field(default='enterprise_fattening_environment', description="数据表名")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = None


class ACFAnalysisRequest(BaseModel):
    """ACF分析请求"""
    table_name: str = Field(default='enterprise_fattening_environment', description="数据表名")
    columns: Optional[List[str]] = Field(None, description="要分析的列名列表")
    lags: int = Field(default=50, description="滞后阶数")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    limit: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "table_name": "enterprise_fattening_environment",
                "columns": ["indoor_temperature", "outdoor_temperature", "indoor_humidity"],
                "lags": 50,
                "start_date": "2024-01-01",
                "end_date": "2024-12-31"
            }
        }