"""
摄像头管理 Service
封装摄像头相关业务逻辑
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select, func

from app.models.DeviceDO import CameraDO
from app.schemas.cameraDTO import CameraCreateDTO, CameraUpdateDTO, CameraQueryDTO, CameraVO
from app.schemas.responseDTO import ListResponseData

class CameraService:
    """摄像头业务逻辑层"""

    # ==================== 查询 ====================

    def get_camera_list(
        self,
        session: Session,
        query: CameraQueryDTO,
    ) -> ListResponseData[CameraVO]:
        """
        获取摄像头列表（支持分页与多条件筛选）

        :param session: 数据库会话
        :param query:   查询参数 DTO
        :return:        分页列表响应数据
        """
        stmt = select(CameraDO)

        # 动态拼接筛选条件
        if query.shed_id is not None:
            stmt = stmt.where(CameraDO.shed_id == query.shed_id)
        if query.pen_id is not None:
            stmt = stmt.where(CameraDO.pen_id == query.pen_id)
        if query.status:
            stmt = stmt.where(CameraDO.status == query.status)
        if query.name:
            stmt = stmt.where(CameraDO.name.contains(query.name))

        # 查询总数
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = session.exec(count_stmt).one()

        # 分页查询
        offset = (query.page - 1) * query.page_size
        cameras = session.exec(stmt.offset(offset).limit(query.page_size)).all()

        return ListResponseData(
            items=[CameraVO.model_validate(c) for c in cameras],
            total=total,
            page=query.page,
            page_size=query.page_size,
        )

    def get_camera_by_id(self, session: Session, camera_id: int) -> CameraVO:
        """
        根据 ID 获取摄像头详情

        :param session:   数据库会话
        :param camera_id: 摄像头 ID
        :return:          摄像头视图对象
        :raises HTTPException 404: 摄像头不存在
        """
        camera = session.get(CameraDO, camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"摄像头 (id={camera_id}) 不存在",
            )
        return CameraVO.model_validate(camera)

    # ==================== 创建 ====================

    def create_camera(self, session: Session, dto: CameraCreateDTO) -> CameraVO:
        """
        创建摄像头

        :param session: 数据库会话
        :param dto:     创建请求 DTO
        :return:        新建摄像头视图对象
        :raises HTTPException 400: 状态值非法
        """
        self._validate_status(dto.status)

        camera = CameraDO(**dto.model_dump())
        session.add(camera)
        session.commit()
        session.refresh(camera)

        return CameraVO.model_validate(camera)

    # ==================== 更新 ====================

    def update_camera(
        self, session: Session, camera_id: int, dto: CameraUpdateDTO
    ) -> CameraVO:
        """
        更新摄像头信息（局部更新，仅修改传入的字段）

        :param session:   数据库会话
        :param camera_id: 摄像头 ID
        :param dto:       更新请求 DTO
        :return:          更新后的摄像头视图对象
        :raises HTTPException 404: 摄像头不存在
        :raises HTTPException 400: 状态值非法
        """
        camera = session.get(CameraDO, camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"摄像头 (id={camera_id}) 不存在",
            )

        update_data = dto.model_dump(exclude_unset=True)

        if "status" in update_data:
            self._validate_status(update_data["status"])

        for field, value in update_data.items():
            setattr(camera, field, value)

        session.add(camera)
        session.commit()
        session.refresh(camera)

        return CameraVO.model_validate(camera)

    # ==================== 删除 ====================

    def delete_camera(self, session: Session, camera_id: int) -> None:
        """
        删除摄像头

        :param session:   数据库会话
        :param camera_id: 摄像头 ID
        :raises HTTPException 404: 摄像头不存在
        """
        camera = session.get(CameraDO, camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"摄像头 (id={camera_id}) 不存在",
            )
        session.delete(camera)
        session.commit()

    # ==================== 私有方法 ====================

    @staticmethod
    def _validate_status(value: str) -> None:
        """校验摄像头状态合法性"""
        allowed = {"online", "offline"}
        if value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"摄像头状态非法，允许值: {allowed}，传入值: '{value}'",
            )


# 单例，供 Router 直接注入使用
camera_service = CameraService()