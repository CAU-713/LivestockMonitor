import time

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


def video_only_generator(video_path: str):
    """
    只播放视频，不进行AI检测的生成器
    """
    cap = cv2.VideoCapture(video_path)
    is_stream = _is_stream_url(video_path)

    # 获取视频的帧率
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_time = 1.0 / fps if fps > 0 else 0.033  # 默认30fps倒数约0.033秒

    try:
        prev_time = time.time()
        while True:
            ret, frame = cap.read()
            if not ret:
                # 如果是流媒体，尝试重新连接
                if is_stream:
                    cap.release()
                    cap = cv2.VideoCapture(video_path)
                    ret, frame = cap.read()
                    if not ret:
                        break
                else:
                    break

            ok, jpeg = cv2.imencode('.jpg', frame)
            if not ok:
                continue

            # 控制帧率，确保播放速度正常
            curr_time = time.time()
            if curr_time - prev_time < frame_time:
                time.sleep(frame_time - (curr_time - prev_time))
            prev_time = curr_time

            # MJPEG 分帧协议
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
    finally:
        cap.release()


def _is_stream_url(path: str) -> bool:
    """
    判断给定路径是否为流媒体URL
    支持 RTSP, HTTP, HTTPS 等流媒体协议
    """
    stream_protocols = ['rtsp://', 'http://', 'https://']
    return any(path.startswith(protocol) for protocol in stream_protocols)