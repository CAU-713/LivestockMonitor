"""
数据分析服务
"""

import matplotlib
import numpy as np
import pandas as pd

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine
from scipy.stats import pearsonr
from statsmodels.graphics.tsaplots import plot_acf
from typing import Optional, List, Dict, Any
import warnings
import io
import base64

warnings.filterwarnings('ignore')

# 设置中文字体支持
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False


class DataAnalysisService:
    """数据分析服务"""

    def __init__(self, db_url: str):
        """
        初始化数据分析服务

        参数:
            db_url: 数据库连接URL
        """
        self.engine = create_engine(db_url)
        self.df = None

    def load_data_from_db(
            self,
            table_name: str = 'enterprise_fattening_environment',
            start_date: Optional[str] = None,
            end_date: Optional[str] = None,
            limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        从数据库加载数据

        返回:
            数据加载信息
        """
        # 构建SQL查询
        query = f"SELECT * FROM {table_name}"
        conditions = []

        if start_date:
            conditions.append(f"record_time >= '{start_date}'")
        if end_date:
            conditions.append(f"record_time <= '{end_date}'")

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY record_time"

        if limit:
            query += f" LIMIT {limit}"

        # 从数据库读取数据
        self.df = pd.read_sql(query, self.engine)

        # 设置时间为索引
        if 'record_time' in self.df.columns:
            self.df['record_time'] = pd.to_datetime(self.df['record_time'])
            self.df = self.df.set_index('record_time')

        # 删除ID列
        if 'id' in self.df.columns:
            self.df = self.df.drop(columns=['id'])

        return {
            'records_count': len(self.df),
            'time_range': {
                'start': str(self.df.index.min()),
                'end': str(self.df.index.max())
            },
            'shape': list(self.df.shape),
            'columns': list(self.df.columns)
        }

    def iqr_outlier_detection(self, col: str, multiplier: float = 1.5) -> int:
        """IQR异常值检测与替换"""
        if self.df is None or col not in self.df.columns:
            return 0

        # 跳过非数值列
        if self.df[col].dtype == 'object':
            return 0

        # 计算四分位数
        Q1 = self.df[col].quantile(0.25)
        Q3 = self.df[col].quantile(0.75)
        IQR = Q3 - Q1

        if IQR == 0:
            return 0

        # 异常值边界
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR

        # 找出异常值
        outlier_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
        outlier_indices = self.df[outlier_mask].index
        outlier_count = len(outlier_indices)

        # 用前后均值替换
        for idx in outlier_indices:
            idx_pos = self.df.index.get_loc(idx)
            prev_val = self.df[col].iloc[idx_pos - 1] if idx_pos > 0 else np.nan
            next_val = self.df[col].iloc[idx_pos + 1] if idx_pos < len(self.df) - 1 else np.nan

            if pd.notna(prev_val) and pd.notna(next_val):
                self.df.loc[idx, col] = (prev_val + next_val) / 2
            elif pd.notna(prev_val):
                self.df.loc[idx, col] = prev_val
            elif pd.notna(next_val):
                self.df.loc[idx, col] = next_val

        return outlier_count

    def clean_data(self) -> Dict[str, Any]:
        """
        数据清洗：异常值检测与缺失值填充

        返回:
            清洗报告
        """
        if self.df is None:
            raise ValueError("Please load data first")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        # 1. IQR异常值处理
        total_outliers = 0
        outlier_details = {}

        for col in numeric_cols:
            count = self.iqr_outlier_detection(col)
            if count > 0:
                outlier_details[col] = count
                total_outliers += count

        # 2. 线性插值填充缺失值
        missing_before = int(self.df[numeric_cols].isnull().sum().sum())
        self.df[numeric_cols] = self.df[numeric_cols].interpolate(method='linear')
        missing_after = int(self.df[numeric_cols].isnull().sum().sum())

        return {
            'outliers_detected': total_outliers,
            'outliers_replaced': total_outliers,
            'outlier_details': outlier_details,
            'missing_before': missing_before,
            'missing_after': missing_after,
            'missing_filled': missing_before - missing_after
        }

    def calculate_statistics(self) -> List[Dict[str, Any]]:
        """
        计算统计量

        返回:
            统计结果列表
        """
        if self.df is None:
            raise ValueError("Please load data first")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns

        stats_list = []
        for col in numeric_cols:
            stats_list.append({
                'variable': col,
                'mean': float(self.df[col].mean()),
                'variance': float(self.df[col].var()),
                'std': float(self.df[col].std()),
                'min': float(self.df[col].min()),
                'max': float(self.df[col].max()),
                'count': int(self.df[col].count())
            })

        return stats_list

    def calculate_correlation(self, threshold: float = 0.7) -> Dict[str, Any]:
        """
        计算Pearson相关系数

        返回:
            相关性分析结果
        """
        if self.df is None:
            raise ValueError("Please load data first")

        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()

        # 过滤掉方差为0的列
        valid_cols = [col for col in numeric_cols if self.df[col].std() > 0]

        subset = self.df[valid_cols].dropna()
        n = len(valid_cols)

        if n < 2:
            raise ValueError("Not enough valid columns for correlation analysis")

        # 计算相关系数矩阵
        corr_matrix = pd.DataFrame(np.zeros((n, n)), index=valid_cols, columns=valid_cols)

        for i in range(n):
            for j in range(n):
                if i == j:
                    corr_matrix.iloc[i, j] = 1.0
                else:
                    r, _ = pearsonr(subset.iloc[:, i], subset.iloc[:, j])
                    corr_matrix.iloc[i, j] = r

        # 转换为字典格式
        corr_dict = {}
        for col in valid_cols:
            corr_dict[col] = corr_matrix[col].to_dict()

        # 找出强相关
        strong_pairs = []
        for i in range(n):
            for j in range(i + 1, n):
                r = corr_matrix.iloc[i, j]
                if abs(r) > threshold:
                    var1 = corr_matrix.index[i]
                    var2 = corr_matrix.columns[j]
                    relation = "positive" if r > 0 else "negative"
                    strong_pairs.append({
                        'variable1': var1,
                        'variable2': var2,
                        'correlation': float(r),
                        'relation': relation
                    })

        return {
            'correlation_matrix': corr_dict,
            'strong_correlations': strong_pairs
        }

    def generate_heatmap_base64(self) -> str:
        """
        生成相关系数热力图（Base64编码）

        返回:
            Base64编码的图片字符串
        """
        if self.df is None:
            raise ValueError("Please load data first")

        # 计算相关系数
        corr_result = self.calculate_correlation()
        corr_matrix_dict = corr_result['correlation_matrix']

        # 转换为DataFrame
        corr_matrix = pd.DataFrame(corr_matrix_dict)

        # 绘制热力图
        plt.figure(figsize=(14, 12))

        sns.heatmap(
            corr_matrix,
            annot=True,
            fmt='.2f',
            cmap='RdBu_r',
            center=0,
            vmin=-1, vmax=1,
            square=True,
            linewidths=0.5,
            cbar_kws={'shrink': 0.8, 'label': 'Correlation Coefficient'},
            annot_kws={'size': 8}
        )

        plt.title('Pearson Correlation Heatmap', fontsize=14)
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()

        # 保存到内存
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()

        return image_base64

    def generate_acf_plot_base64(
            self,
            columns: Optional[List[str]] = None,
            lags: int = 50
    ) -> str:
        """
        生成ACF分析图（Base64编码）

        返回:
            Base64编码的图片字符串
        """
        if self.df is None:
            raise ValueError("Please load data first")

        # 默认分析列
        if columns is None:
            columns = [
                'indoor_temperature', 'outdoor_temperature', 'indoor_humidity',
                'temperature_sensor_1', 'temperature_sensor_2', 'variable_speed_fan_1'
            ]
            columns = [col for col in columns if col in self.df.columns]

        # 过滤有效列
        valid_cols = []
        for col in columns:
            if col in self.df.columns:
                data = self.df[col].dropna()
                if len(data) >= 10 and data.std() > 0:
                    valid_cols.append(col)

        if not valid_cols:
            raise ValueError("No valid columns for ACF analysis")

        # 绘制ACF图
        n_cols = len(valid_cols)
        n_rows = (n_cols + 1) // 2

        fig, axes = plt.subplots(n_rows, 2, figsize=(14, 4 * n_rows))
        axes = axes.flatten() if n_cols > 1 else [axes]

        for i, col in enumerate(valid_cols):
            data = self.df[col].dropna()
            max_lags = min(lags, len(data) // 2 - 1)

            plot_acf(data, lags=max_lags, alpha=0.05, ax=axes[i])
            axes[i].set_title(f'ACF - {col}', fontsize=12)
            axes[i].set_xlabel('Lag')
            axes[i].set_ylabel('ACF')
            axes[i].grid(True, alpha=0.3)

        # 隐藏多余的子图
        for j in range(i + 1, len(axes)):
            axes[j].set_visible(False)

        plt.tight_layout()

        # 保存到内存
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        plt.close()

        return image_base64

    def get_cleaned_data_csv(self) -> str:
        """
        获取清洗后的数据（CSV格式字符串）

        返回:
            CSV格式的数据字符串
        """
        if self.df is None:
            raise ValueError("No data available")

        return self.df.to_csv(encoding='utf-8-sig')

    def get_statistics_csv(self) -> str:
        """
        获取统计结果（CSV格式字符串）

        返回:
            CSV格式的统计数据字符串
        """
        stats = self.calculate_statistics()
        stats_df = pd.DataFrame(stats)
        return stats_df.to_csv(index=False, encoding='utf-8-sig')

    def get_correlation_csv(self) -> str:
        """
        获取相关系数矩阵（CSV格式字符串）

        返回:
            CSV格式的相关系数矩阵字符串
        """
        corr_result = self.calculate_correlation()
        corr_df = pd.DataFrame(corr_result['correlation_matrix'])
        return corr_df.to_csv(encoding='utf-8-sig')