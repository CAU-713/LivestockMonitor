import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import numpy as np
from app.models.RecordDataDO import HouseComprehensiveEnvironmentDO


def map_excel_to_model(row_data):
    """
    将Excel数据映射到EnvironmentRecordDO模型
    """
    # 解析Excel中的列名到模型字段的映射
    mapping = {
        'CO2_ID1': 'co2_area1',
        'CO2_ID2': 'co2_area2',
        'CO2_ID3': 'co2_area3',
        '内温_ID6': 'temperature_area1',
        '内湿_ID6': 'humidity_area1',
        '内温_ID7': 'temperature_area2',
        '内湿_ID7': 'humidity_area2',
        '内温_ID8': 'temperature_area3',
        '内湿_ID8': 'humidity_area3',
        '风速_ID11': 'wind_speed_area1',
        '风速_ID12': 'wind_speed_area2',
        '风速_ID13': 'wind_speed_area3',
        '压差_ID15': 'pressure_difference',
        '舍外光照_ID17': 'outdoor_illuminance',
        '黑球温度_ID20': 'black_globe_temp_area1',
        '黑球温度_ID21': 'black_globe_temp_area2',
        '黑球温度_ID22': 'black_globe_temp_area3',
        '舍外黑球温度_ID23': 'outdoor_black_globe_temp',
        '舍内光照-ID25（原氨气NH3_ID25）': 'illuminance_area1',
        '舍内光照-ID26': 'illuminance_area2',
        '舍内光照-ID27': 'illuminance_area3',
        '舍外温度-ID30': 'outdoor_temperature',
        '舍外湿度-ID30': 'outdoor_humidity'
    }

    # 创建字典存储映射后的数据
    mapped_data = {'record_time': pd.to_datetime(row_data['记录时间'])}

    for excel_col, model_field in mapping.items():
        if excel_col in row_data and pd.notna(row_data[excel_col]):
            mapped_data[model_field] = float(row_data[excel_col])

    return mapped_data


def import_HouseComprehensiveEnvironmentDO_from_excel(excel_file_path, db_url, shed_id):
    """
    从Excel文件导入环境数据到PostgreSQL数据库
    """
    # 创建数据库引擎
    engine = create_engine(db_url)

    # 读取Excel文件
    df = pd.read_excel(excel_file_path)

    print(f"读取到 {len(df)} 条记录")

    # 处理每行数据
    records_to_insert = []

    for index, row in df.iterrows():
        # 映射Excel数据到模型
        row_dict = row.to_dict()
        mapped_data = map_excel_to_model(row_dict)

        # 添加固定的shed_id
        mapped_data['shed_id'] = shed_id

        # 不设置id，让数据库自动生成
        mapped_data.pop('id', None)  # 移除id字段，让数据库自动生成

        # 创建EnvironmentRecordDO实例
        record = HouseComprehensiveEnvironmentDO(**mapped_data)
        records_to_insert.append(record)

        if (index + 1) % 100 == 0:
            print(f"已处理 {index + 1} 条记录")

    # 批量插入数据库 - 使用新的SQLModel方法
    try:
        with engine.connect() as conn:
            with conn.begin():
                for record in records_to_insert:
                    # 使用 model_dump() 替代 dict()
                    data_dict = record.model_dump()
                    # 移除id字段，让数据库自动生成
                    if 'id' in data_dict and data_dict['id'] is None:
                        data_dict.pop('id')

                    conn.execute(HouseComprehensiveEnvironmentDO.__table__.insert(), data_dict)

        print(f"成功导入 {len(records_to_insert)} 条环境记录到数据库")

    except Exception as e:
        print(f"导入数据时发生错误: {str(e)}")
        raise


def main():
    # 配置参数
    EXCEL_FILE_PATH = "../datas/envs.xlsx"
    DB_URL = "postgresql://postgres:password@localhost:5432/postgres_db_name"
    SHED_ID = 1

    print("开始导入环境数据...")
    import_HouseComprehensiveEnvironmentDO_from_excel(EXCEL_FILE_PATH, DB_URL, SHED_ID)
    print("数据导入完成！")


if __name__ == "__main__":
    main()
