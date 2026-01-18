from fastapi import APIRouter
from fastapi import Query
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

from app.services.yolo import mjpeg_generator, video_only_generator

router = APIRouter(prefix="/detect", tags=["检测接口"])

# @router.get("/infer", summary="AI检测接口", description="根据指定模型和视频源进行实时检测")
# def infer(
#     model: str = Query(..., description="模型相对路径，如 checkpoints/v8.pt"),
#     video: str = Query(..., description="视频相对路径或流媒体地址，如 videos/test.mp4 或 rtsp://example.com/stream")
# ) -> StreamingResponse:
#     """
#     立即返回 MJPEG 流（multipart/x-mixed-replace），
#     前端 <img src="/infer?model=...&video=..."> 即可观看。
#     支持本地视频文件和实时监控流（RTSP、HTTP等）。
#     """
#     return StreamingResponse(
#         mjpeg_generator(model, video),
#         media_type="multipart/x-mixed-replace; boundary=frame"
#     )
@router.get("/infer", summary="AI检测接口", description="根据指定模型和视频源进行实时检测")
def infer(
    model: str = Query(..., description="模型相对路径，如 checkpoints/v8.pt"),
    video: str = Query(..., description="视频相对路径或流媒体地址，如 videos/test.mp4 或 rtsp://example.com/stream")
) -> StreamingResponse:
    """
    立即返回 MJPEG 流（multipart/x-mixed-replace），
    前端 <img src="/infer?model=...&video=..."> 即可观看。
    支持本地视频文件和实时监控流（RTSP、HTTP等）。
    """
    # 修改为只播放视频，不进行检测
    return StreamingResponse(
        video_only_generator(video),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
