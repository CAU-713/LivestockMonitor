import pandas as pd
from app.models.RecordDataDO import EnterpriseFatteningEnvironmentDO
from sqlalchemy import create_engine


def import_EnterpriseFatteningEnvironmentDO_from_csv(csv_file_path, db_url):
    """
    从CSV文件导入企业育肥环境数据到PostgreSQL数据库
    """
    # 首先尝试用逗号分隔符读取
    try:
        df = pd.read_csv(csv_file_path, sep=',', encoding='utf-8')
    except:
        # 如果失败，尝试自动检测分隔符
        df = pd.read_csv(csv_file_path, sep=None, engine='python', encoding='utf-8')

    print("CSV文件列名:")
    for i, col in enumerate(df.columns):
        print(f"{i}: '{col}'")
    print(f"\n数据形状: {df.shape}")
    print("\n前几行数据:")
    print(df.head())

    # 检查数据是否正确加载
    if len(df.columns) <= 1:
        print("错误：数据列数不足，可能是分隔符问题")
        return

    # 检查是否有列名包含"时间"的列
    time_col = None
    for col in df.columns:
        if '时间' in str(col) or 'time' in str(col).lower():
            time_col = col
            break

    if time_col is None:
        # 如果没找到时间列，尝试常见的时间列名
        for col in df.columns:
            if any(keyword in str(col) for keyword in ['时间', 'time', 'date', 'Time']):
                time_col = col
                break

    if time_col is None:
        print("错误：未找到时间列")
        return

    print(f"使用 '{time_col}' 作为时间列")

    # 预处理数据：转换时间格式
    # 先将时间列转换为字符串格式，然后再转换为datetime
    df[time_col] = df[time_col].astype(str)
    df[time_col] = pd.to_datetime(df[time_col], format='%Y/%m/%d %H:%M', errors='coerce')

    # 如果上面的格式失败，尝试自动解析
    if df[time_col].isna().all():
        df[time_col] = pd.to_datetime(df[time_col], errors='coerce')

    # 删除时间解析失败的行
    df = df.dropna(subset=[time_col])

    print(f"读取到 {len(df)} 条记录，有效记录 {len(df)} 条")

    # 根据实际列名进行映射
    actual_column_mapping = {}
    for actual_col in df.columns:
        if any(keyword in str(actual_col) for keyword in ['时间', 'time', 'Time']):
            actual_column_mapping[actual_col] = 'record_time'
        elif '日龄' in str(actual_col):
            actual_column_mapping[actual_col] = 'age_days'
        elif '目标' in str(actual_col):
            actual_column_mapping[actual_col] = 'target_temperature'
        elif '阶段' in str(actual_col):
            actual_column_mapping[actual_col] = 'phase'
        elif '需求' in str(actual_col):
            actual_column_mapping[actual_col] = 'required_airflow'
        elif '实际' in str(actual_col):
            actual_column_mapping[actual_col] = 'actual_airflow'
        elif '舍内(' in str(actual_col) and ')' in str(actual_col):
            actual_column_mapping[actual_col] = 'indoor_temperature'
        elif '舍外(' in str(actual_col) and ')' in str(actual_col):
            actual_column_mapping[actual_col] = 'outdoor_temperature'
        elif '舍内湿度' in str(actual_col):
            actual_column_mapping[actual_col] = 'indoor_humidity'
        elif '温度1' in str(actual_col):
            actual_column_mapping[actual_col] = 'temperature_sensor_1'
        elif '温度2' in str(actual_col):
            actual_column_mapping[actual_col] = 'temperature_sensor_2'
        elif '温度3' in str(actual_col):
            actual_column_mapping[actual_col] = 'temperature_sensor_3'
        elif '温度4' in str(actual_col):
            actual_column_mapping[actual_col] = 'temperature_sensor_4'
        elif '变速1' in str(actual_col):
            actual_column_mapping[actual_col] = 'variable_speed_fan_1'
        elif '变速2' in str(actual_col):
            actual_column_mapping[actual_col] = 'variable_speed_fan_2'
        elif '变速3' in str(actual_col):
            actual_column_mapping[actual_col] = 'variable_speed_fan_3'
        elif '变速4' in str(actual_col):
            actual_column_mapping[actual_col] = 'variable_speed_fan_4'
        elif '变速5' in str(actual_col):
            actual_column_mapping[actual_col] = 'variable_speed_fan_5'
        elif '定速1' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_1'
        elif '定速2' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_2'
        elif '定速3' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_3'
        elif '定速4' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_4'
        elif '定速5' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_5'
        elif '定速6' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_6'
        elif '定速7' in str(actual_col):
            actual_column_mapping[actual_col] = 'fixed_speed_fan_7'
        elif '加热器1' in str(actual_col):
            actual_column_mapping[actual_col] = 'heater_1'
        elif '加热器2' in str(actual_col):
            actual_column_mapping[actual_col] = 'heater_2'
        elif '屋顶小窗' in str(actual_col):
            actual_column_mapping[actual_col] = 'roof_window'
        elif '滑帘' in str(actual_col):
            actual_column_mapping[actual_col] = 'sliding_curtain'
        elif '报警器' in str(actual_col):
            actual_column_mapping[actual_col] = 'alarm_status'

    print(f"映射的列: {actual_column_mapping}")

    # 重命名列
    df_renamed = df.rename(columns=actual_column_mapping)

    # 转换数值列
    numeric_columns = ['age_days', 'target_temperature', 'phase', 'required_airflow',
                       'actual_airflow', 'indoor_temperature', 'outdoor_temperature',
                       'indoor_humidity', 'temperature_sensor_1', 'temperature_sensor_2',
                       'temperature_sensor_3', 'temperature_sensor_4', 'variable_speed_fan_1',
                       'variable_speed_fan_2', 'variable_speed_fan_3', 'variable_speed_fan_4',
                       'variable_speed_fan_5', 'roof_window', 'sliding_curtain']

    for col in numeric_columns:
        if col in df_renamed.columns:
            df_renamed[col] = pd.to_numeric(df_renamed[col], errors='coerce')

    # 选择有效的列
    valid_columns = [col.name for col in EnterpriseFatteningEnvironmentDO.__table__.columns]
    available_columns = [col for col in df_renamed.columns if col in valid_columns]
    df_filtered = df_renamed[available_columns]

    print(f"最终用于导入的列: {list(df_filtered.columns)}")

    # 创建数据库引擎并批量插入
    engine = create_engine(db_url)

    try:
        df_filtered.to_sql(
            name='enterprise_fattening_environment',
            con=engine,
            if_exists='append',
            index=False,
            method='multi'
        )

        print(f"成功导入 {len(df_filtered)} 条企业育肥环境记录到数据库")

    except Exception as e:
        print(f"批量导入数据时发生错误: {str(e)}")
        raise


def main():
    # 配置参数
    CSV_FILE_PATH = "../datas/企业育肥环境数据.csv"
    DB_URL = "postgresql://postgres:password@localhost:5432/postgres_db_name"

    print("开始导入企业育肥环境数据...")
    import_EnterpriseFatteningEnvironmentDO_from_csv(CSV_FILE_PATH, DB_URL)
    print("数据导入完成！")


if __name__ == "__main__":
    main()
