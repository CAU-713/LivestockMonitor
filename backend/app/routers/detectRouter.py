from fastapi import Query
from fastapi.responses import StreamingResponse

from fastapi import APIRouter

from app.services.yolo import YoloStream, mjpeg_generator
router = APIRouter(prefix="/detect", tags=["检测接口"])

@router.get("/infer")
def infer(
    model: str = Query(..., description="模型相对路径，如 models/yolov8n.pt"),
    video: str = Query(..., description="视频相对路径或流媒体地址，如 videos/test.mp4 或 rtsp://example.com/stream")
):
    """
    立即返回 MJPEG 流（multipart/x-mixed-replace），
    前端 <img src="/infer?model=...&video=..."> 即可观看。
    支持本地视频文件和实时监控流（RTSP、HTTP等）。
    """
    return StreamingResponse(
        mjpeg_generator(model, video),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
