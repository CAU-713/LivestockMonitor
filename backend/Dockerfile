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

COPY requirements.txt .
# 优先单独安装轻量级安全依赖，确保 bcrypt/passlib 在缓存层中稳定存在
RUN pip install --no-cache-dir -i https://mirrors.cloud.tencent.com/pypi/simple \
    passlib[bcrypt]==1.7.4 bcrypt==4.0.1
# 安装其余依赖
RUN pip install --no-cache-dir -i https://mirrors.cloud.tencent.com/pypi/simple -r requirements.txt

COPY app/ ./app/

RUN mkdir -p ../temp

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]