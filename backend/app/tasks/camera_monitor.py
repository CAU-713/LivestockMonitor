import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import List

from sqlmodel import select
from sqlalchemy.exc import SQLAlchemyError

from backend.app.config import get_session
from backend.app.models.deviceDO import CameraDO
from backend.app.models.recordDataDO import BehaviorRecordDO
from backend.app.services.yolo import YoloStream

# 配置日志
logger = logging.getLogger(__name__)

class CameraMonitorTask:
    def __init__(self, interval: int = 30):
        """
        初始化摄像头监控任务
        
        Args:
            interval: 执行间隔（秒）
        """
        self.interval = interval
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.running = False

    async def start(self):
        """
        启动监控任务
        """
        self.running = True
        logger.info("摄像头监控任务已启动")
        
        while self.running:
            try:
                await self._process_cameras()
                await asyncio.sleep(self.interval)
            except Exception as e:
                logger.error(f"执行摄像头监控任务时出错: {e}")
                await asyncio.sleep(self.interval)

    async def stop(self):
        """
        停止监控任务
        """
        self.running = False
        self.executor.shutdown(wait=True)
        logger.info("摄像头监控任务已停止")

    async def _process_cameras(self):
        """
        处理所有在线摄像头
        """
        try:
            # 获取所有在线摄像头
            cameras = self._get_online_cameras()
            
            # 创建异步任务处理每个摄像头
            tasks = [
                self._process_single_camera(camera) 
                for camera in cameras
            ]
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
                
        except Exception as e:
            logger.error(f"处理摄像头列表时出错: {e}")

    def _get_online_cameras(self) -> List[CameraDO]:
        """
        从数据库获取所有在线摄像头
        
        Returns:
            在线摄像头列表
        """
        try:
            with get_session() as session:
                statement = select(CameraDO).where(CameraDO.status == "online")
                result = session.exec(statement)
                return result.all()
        except SQLAlchemyError as e:
            logger.error(f"查询摄像头数据时出错: {e}")
            return []

    async def _process_single_camera(self, camera: CameraDO):
        """
        处理单个摄像头的视频流分析
        
        Args:
            camera: 摄像头对象
        """
        try:
            # 在线程池中运行视频分析
            loop = asyncio.get_event_loop()
            behavior_result = await loop.run_in_executor(
                self.executor, 
                self._analyze_camera_stream, 
                camera.stream_url
            )
            
            # 保存分析结果
            if behavior_result:
                await self._save_behavior_record(camera.id, behavior_result)
                
        except Exception as e:
            logger.error(f"处理摄像头 {camera.id} 时出错: {e}")

    def _analyze_camera_stream(self, stream_url: str) -> dict:
        """
        分析摄像头视频流（在ThreadPoolExecutor中运行）
        
        Args:
            stream_url: 视频流地址
            
        Returns:
            行为分析结果
        """
        try:
            # 这里应该使用实际的YOLO模型进行分析
            # 当前示例只是演示框架
            yolo_stream = YoloStream("yolov8n.pt", stream_url)
            
            # 这里应该是实际的行为分析逻辑
            # 简化示例：只获取一帧并返回模拟数据
            try:
                next(yolo_stream)
                # 模拟分析结果
                result = {
                    "timestamp": datetime.now().isoformat(),
                    "eating_count": 5,
                    "drinking_count": 2,
                    "licking_count": 1,
                    "standing_count": 8,
                    "lying_count": 3
                }
                return result
            finally:
                yolo_stream.release()
                
        except Exception as e:
            logger.error(f"分析视频流 {stream_url} 时出错: {e}")
            return {}

    async def _save_behavior_record(self, camera_id: int, behavior_data: dict):
        """
        保存行为分析结果到数据库
        
        Args:
            camera_id: 摄像头ID
            behavior_data: 行为分析数据
        """
        try:
            behavior_record = BehaviorRecordDO(
                camera_id=camera_id,
                timestamp=behavior_data["timestamp"],
                eating_count=behavior_data.get("eating_count", 0),
                drinking_count=behavior_data.get("drinking_count", 0),
                licking_count=behavior_data.get("licking_count", 0),
                standing_count=behavior_data.get("standing_count", 0),
                lying_count=behavior_data.get("lying_count", 0)
            )
            
            with get_session() as session:
                session.add(behavior_record)
                session.commit()
                session.refresh(behavior_record)
                
            logger.info(f"保存摄像头 {camera_id} 的行为记录成功")
            
        except SQLAlchemyError as e:
            logger.error(f"保存行为记录到数据库时出错: {e}")
        except Exception as e:
            logger.error(f"保存行为记录时出现未知错误: {e}")