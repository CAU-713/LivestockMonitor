"""
行为监控服务层
处理行为统计数据相关业务逻辑
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.RecordDataDO import BehaviorRecordDO
from app.models.DeviceDO import CameraDO
from app.schemas.behaviorDTO import (
    BehaviorRecordResponseDTO,
    BehaviorLatestResponseDTO,
    BehaviorTrendPoint,
    BehaviorTrendResponseDTO,
)
from app.schemas.responseDTO import ListResponseData


class BehaviorService:
    """行为监控服务类"""

    @staticmethod
    def get_latest(db: Session, camera_id: int) -> BehaviorLatestResponseDTO:
        """获取指定摄像头的最新行为统计"""
        # 验证摄像头
        camera = db.get(CameraDO, camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"摄像头 ID {camera_id} 不存在"
            )

        record = db.exec(
            select(BehaviorRecordDO)
            .where(BehaviorRecordDO.camera_id == camera_id)
            .order_by(BehaviorRecordDO.timestamp.desc())
        ).first()

        if not record:
            # 没有数据时返回零值
            return BehaviorLatestResponseDTO(
                camera_id=camera_id,
                timestamp=datetime.utcnow(),
                eating_count=0,
                drinking_count=0,
                licking_count=0,
                standing_count=0,
                lying_count=0,
                total_count=0,
            )

        return BehaviorLatestResponseDTO(
            camera_id=camera_id,
            timestamp=record.timestamp,
            eating_count=record.eating_count,
            drinking_count=record.drinking_count,
            licking_count=record.licking_count,
            standing_count=record.standing_count,
            lying_count=record.lying_count,
            total_count=record.eating_count + record.drinking_count + record.licking_count + record.standing_count + record.lying_count,
        )

    @staticmethod
    def get_records(
        db: Session,
        camera_id: int,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ListResponseData[BehaviorRecordResponseDTO]:
        """获取行为历史记录"""
        stmt = select(BehaviorRecordDO).where(BehaviorRecordDO.camera_id == camera_id)

        if start_time:
            stmt = stmt.where(BehaviorRecordDO.timestamp >= start_time)
        if end_time:
            stmt = stmt.where(BehaviorRecordDO.timestamp <= end_time)

        stmt = stmt.order_by(BehaviorRecordDO.timestamp.desc())

        total = db.exec(select(func.count()).select_from(stmt.subquery())).one()
        records = db.exec(stmt.offset((page - 1) * page_size).limit(page_size)).all()

        return ListResponseData(
            items=[BehaviorRecordResponseDTO.model_validate(r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def get_trend(db: Session, camera_id: int, hours: int = 24) -> BehaviorTrendResponseDTO:
        """获取行为趋势数据（近 N 小时）"""
        since = datetime.utcnow() - timedelta(hours=hours)

        records = db.exec(
            select(BehaviorRecordDO)
            .where(BehaviorRecordDO.camera_id == camera_id)
            .where(BehaviorRecordDO.timestamp >= since)
            .order_by(BehaviorRecordDO.timestamp.asc())
        ).all()

        data = [
            BehaviorTrendPoint(
                timestamp=str(r.timestamp),
                eating_count=r.eating_count,
                drinking_count=r.drinking_count,
                standing_count=r.standing_count,
                lying_count=r.lying_count,
            )
            for r in records
        ]

        return BehaviorTrendResponseDTO(
            camera_id=camera_id,
            hours=hours,
            data=data,
        )