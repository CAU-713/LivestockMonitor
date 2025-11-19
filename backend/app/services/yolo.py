import cv2
from ultralytics import YOLO

class YoloStream:
    def __init__(self, model_path: str, video_path: str, imgsz: int = 640):
        self.model = YOLO(model_path)
        self.cap = cv2.VideoCapture(video_path)
        self.imgsz = imgsz

    def __iter__(self):
        return self

    def __next__(self):
        ret, frame = self.cap.read()
        if not ret:
            raise StopIteration
        results = self.model(frame, imgsz=self.imgsz, verbose=False)
        annotated = results[0].plot()
        ok, jpeg = cv2.imencode('.jpg', annotated)
        return jpeg.tobytes()

    def release(self):
        self.cap.release()