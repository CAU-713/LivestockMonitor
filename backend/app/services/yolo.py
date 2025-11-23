import cv2
from ultralytics import YOLO

class YoloStream:
    def __init__(self, model_path: str, video_path: str, imgsz: int = 640):
        self.model = YOLO(model_path)
        # 判断是否为流媒体地址
        self.is_stream = self._is_stream_url(video_path)
        self.cap = cv2.VideoCapture(video_path)
        self.imgsz = imgsz

    def _is_stream_url(self, path: str) -> bool:
        """
        判断给定路径是否为流媒体URL
        支持 RTSP, HTTP, HTTPS 等流媒体协议
        """
        stream_protocols = ['rtsp://', 'http://', 'https://']
        return any(path.startswith(protocol) for protocol in stream_protocols)

    def __iter__(self):
        return self

    def __next__(self):
        ret, frame = self.cap.read()
        if not ret:
            # 如果是流媒体，尝试重新连接
            if self.is_stream:
                self.cap.release()
                self.cap = cv2.VideoCapture(self.cap.get(cv2.CAP_PROP_OPENING_URL))
                ret, frame = self.cap.read()
                if not ret:
                    raise StopIteration
            else:
                raise StopIteration
        
        results = self.model(frame, imgsz=self.imgsz, verbose=False)
        annotated = results[0].plot()
        ok, jpeg = cv2.imencode('.jpg', annotated)
        return jpeg.tobytes()

    def release(self):
        self.cap.release()

def mjpeg_generator(model_path: str, video_path: str):
    stream = YoloStream(model_path, video_path)
    try:
        for jpeg in stream:
            # MJPEG 分帧协议
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg + b'\r\n')
    finally:
        stream.release()
