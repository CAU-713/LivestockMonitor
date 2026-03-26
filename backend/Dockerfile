FROM python:3.12-slim

WORKDIR /app

RUN sed -i 's|deb.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# === 第一层：大型稳定依赖（ultralytics/torch/opencv 等）===
# 仅当 requirements-base.txt 发生变化时才重新安装，节省大量构建时间
COPY requirements-base.txt .
RUN pip install --no-cache-dir -i https://mirrors.cloud.tencent.com/pypi/simple -r requirements-base.txt

# === 第二层：轻量业务依赖（fastapi/sqlmodel/passlib 等）===
# 业务迭代时只重装这一层，大依赖缓存保持不变
COPY requirements.txt .
RUN pip install --no-cache-dir -i https://mirrors.cloud.tencent.com/pypi/simple -r requirements.txt

# === 第三层：应用代码 ===
COPY app/ ./app/

RUN mkdir -p ../temp

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
