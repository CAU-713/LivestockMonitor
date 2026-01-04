# Dockerfile
# 使用刚才构建的 uv 依赖镜像作为基础镜像
FROM my-project-uv-base:latest

# 设置工作目录
WORKDIR /app

# 复制项目代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["python", "main.py"]
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
