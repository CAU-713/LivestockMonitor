"""
历史数据服务层
处理传感器历史数据和视频历史数据的业务逻辑
"""
from typing import List, Optional
from datetime import datetime, timedelta
from sqlmodel import Session, select, func, and_, or_
from fastapi import HTTPException, status

from app.models.RecordDataDO import SensorRecordDO,VideoRecordDO
from app.models.DeviceDO import SensorDO, SensorTypeDO,CameraDO
from app.models.FacilityDO import ShedDO
from app.schemas.historyDTO import (
    SensorHistoryDataDTO,
    TimeValuePairDTO,
    VideoInfoDTO,
    VideoListResponseDTO,
    SensorHistoryQueryDTO,
    VideoHistoryQueryDTO
)
from app.schemas.responseDTO import ListResponseData


class SensorHistoryService:
    """传感器历史数据服务类"""

    @staticmethod
    def get_sensor_history_data(
            db: Session,
            query_params: SensorHistoryQueryDTO
    ) -> List[SensorHistoryDataDTO]:
        """
        查询传感器历史数据

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            传感器历史数据列表
        """
        # 构建传感器查询条件
        sensor_filters = []

        if query_params.shed_ids:
            sensor_filters.append(SensorDO.shed_id.in_(query_params.shed_ids))

        if query_params.sensor_types:
            sensor_filters.append(SensorDO.type.in_(query_params.sensor_types))

        # 查询符合条件的传感器
        sensor_statement = select(SensorDO)
        if sensor_filters:
            sensor_statement = sensor_statement.where(and_(*sensor_filters))

        sensors = db.exec(sensor_statement).all()

        if not sensors:
            return []

        # 为每个传感器查询历史数据
        result = []
        for sensor in sensors:
            # 获取传感器类型信息
            sensor_type = db.get(SensorTypeDO, sensor.type)
            if not sensor_type:
                continue

            # 获取羊舍信息
            shed = db.get(ShedDO, sensor.shed_id)
            if not shed:
                continue

            # 查询该传感器的历史数据
            data_filters = [SensorRecordDO.sensor_id == sensor.id]

            if query_params.start:
                data_filters.append(SensorRecordDO.timestamp >= query_params.start)

            if query_params.end:
                data_filters.append(SensorRecordDO.timestamp <= query_params.end)

            # 根据粒度聚合数据
            if query_params.granularity == "raw":
                # 原始数据
                data_statement = select(SensorRecordDO).where(
                    and_(*data_filters)
                ).order_by(SensorRecordDO.timestamp)

                data_records = db.exec(data_statement).all()

                data_points = [
                    TimeValuePairDTO(
                        time=record.timestamp.isoformat() + "Z",
                        value=record.value
                    )
                    for record in data_records
                ]

            elif query_params.granularity == "hour":
                # 按小时聚合
                data_points = SensorHistoryService._aggregate_by_hour(
                    db, sensor.id, query_params.start, query_params.end
                )

            elif query_params.granularity == "day":
                # 按天聚合
                data_points = SensorHistoryService._aggregate_by_day(
                    db, sensor.id, query_params.start, query_params.end
                )

            else:
                data_points = []

            # 构建响应
            sensor_data = SensorHistoryDataDTO(
                sensor_id=f"sensor-{sensor.id}",
                shed_id=f"shed-{shed.id}",
                sensor_name=sensor.name,
                sensor_type=sensor.type,
                unit=sensor_type.unit,
                data=data_points
            )

            result.append(sensor_data)

        return result

    @staticmethod
    def _aggregate_by_hour(
            db: Session,
            sensor_id: int,
            start: Optional[datetime],
            end: Optional[datetime]
    ) -> List[TimeValuePairDTO]:
        """
        按小时聚合数据

        Args:
            db: 数据库会话
            sensor_id: 传感器ID
            start: 开始时间
            end: 结束时间

        Returns:
            聚合后的数据点列表
        """
        # PostgreSQL 的小时聚合查询
        # 这里使用 date_trunc 函数按小时分组
        from sqlalchemy import text

        query = text("""
            SELECT 
                date_trunc('hour', timestamp) as hour,
                AVG(value) as avg_value
            FROM sensor_data
            WHERE sensor_id = :sensor_id
                AND (:start IS NULL OR timestamp >= :start)
                AND (:end IS NULL OR timestamp <= :end)
            GROUP BY hour
            ORDER BY hour
        """)

        result = db.execute(
            query,
            {
                "sensor_id": sensor_id,
                "start": start,
                "end": end
            }
        )

        data_points = [
            TimeValuePairDTO(
                time=row.hour.isoformat() + "Z",
                value=round(row.avg_value, 2)
            )
            for row in result
        ]

        return data_points

    @staticmethod
    def _aggregate_by_day(
            db: Session,
            sensor_id: int,
            start: Optional[datetime],
            end: Optional[datetime]
    ) -> List[TimeValuePairDTO]:
        """
        按天聚合数据

        Args:
            db: 数据库会话
            sensor_id: 传感器ID
            start: 开始时间
            end: 结束时间

        Returns:
            聚合后的数据点列表
        """
        from sqlalchemy import text

        query = text("""
            SELECT 
                date_trunc('day', timestamp) as day,
                AVG(value) as avg_value
            FROM sensor_data
            WHERE sensor_id = :sensor_id
                AND (:start IS NULL OR timestamp >= :start)
                AND (:end IS NULL OR timestamp <= :end)
            GROUP BY day
            ORDER BY day
        """)

        result = db.execute(
            query,
            {
                "sensor_id": sensor_id,
                "start": start,
                "end": end
            }
        )

        data_points = [
            TimeValuePairDTO(
                time=row.day.strftime("%Y-%m-%d"),  # 日期格式
                value=round(row.avg_value, 2)
            )
            for row in result
        ]

        return data_points


class VideoHistoryService:
    """视频历史数据服务类"""

    @staticmethod
    def get_video_history(
            db: Session,
            query_params: VideoHistoryQueryDTO
    ) -> ListResponseData[VideoInfoDTO]:
        """
        查询历史视频数据

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            视频列表和分页信息
        """
        # 构建查询条件
        filters = []

        if query_params.shed_id:
            filters.append(VideoRecordDO.shed_id == query_params.shed_id)

        if query_params.camera_id:
            filters.append(VideoRecordDO.camera_id == query_params.camera_id)

        if query_params.start_time:
            filters.append(VideoRecordDO.start_time >= query_params.start_time)

        if query_params.end_time:
            filters.append(VideoRecordDO.end_time <= query_params.end_time)

        # 构建查询语句
        statement = select(VideoRecordDO)
        if filters:
            statement = statement.where(and_(*filters))

        statement = statement.order_by(VideoRecordDO.start_time.desc())

        # 获取总数
        total_statement = select(func.count()).select_from(statement.subquery())
        total = db.exec(total_statement).one()

        # 添加分页
        offset = (query_params.page - 1) * query_params.page_size
        statement = statement.offset(offset).limit(query_params.page_size)

        # 执行查询
        videos = db.exec(statement).all()

        # 构建响应数据
        video_list = []
        for video in videos:
            # 获取摄像头信息
            camera = db.get(CameraDO, video.camera_id)
            # 获取羊舍信息
            shed = db.get(ShedDO, video.shed_id)

            video_info = VideoInfoDTO(
                id=f"video-{video.id}",
                camera_id=f"cam-{video.camera_id}" if camera else f"cam-{video.camera_id}",
                shed_id=f"shed-{video.shed_id}" if shed else f"shed-{video.shed_id}",
                start_time=video.start_time.isoformat() + ".000Z",
                end_time=video.end_time.isoformat() + ".000Z",
                duration=video.duration,
                thumbnail_url=video.thumbnail_url,
                file_size=video.file_size,
                resolution=video.resolution
            )

            video_list.append(video_info)

        return ListResponseData(
            items=video_list,
            total=total,
            page=query_params.page,
            page_size=query_params.page_size
        )

    @staticmethod
    def get_video_list_only(
            db: Session,
            query_params: VideoHistoryQueryDTO
    ) -> VideoListResponseDTO:
        """
        获取视频列表（不带分页信息）

        Args:
            db: 数据库会话
            query_params: 查询参数

        Returns:
            视频列表
        """
        result = VideoHistoryService.get_video_history(db, query_params)

        return VideoListResponseDTO(
            videos=result.items
        )