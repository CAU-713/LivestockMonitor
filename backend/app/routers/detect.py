from fastapi import Query
from fastapi.responses import StreamingResponse

from fastapi import APIRouter

from app.services.yolo import YoloStream
router = APIRouter(tags=["检测接口"])

def mjpeg_generator(model_path: str, video_path: str):
    stream = YoloStream(model_path, video_path)
    try:
        for jpeg in stream:
            # MJPEG 分帧协议
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n')
    finally:
        stream.release()

@router.get("/infer")
def infer(
    model: str = Query(..., description="模型相对路径，如 models/yolov8n.pt"),
    video: str = Query(..., description="视频相对路径，如 videos/test.mp4")
):
    """
    立即返回 MJPEG 流（multipart/x-mixed-replace），
    前端 <img src="/infer?model=...&video=..."> 即可观看。
    """
    return StreamingResponse(
        mjpeg_generator(model, video),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
