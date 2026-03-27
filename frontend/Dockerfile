# Dockerfile for React frontend
FROM node:20

WORKDIR /app

# 使用国内镜像加速
RUN npm config set registry https://registry.npmmirror.com

COPY package*.json ./
RUN npm install

COPY . .

# Set build-time environment variables for Next.js
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# BACKEND_URL 用于 next.config.ts 中的 rewrites 代理（服务端）
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

# 生产构建
RUN npm run build

EXPOSE 3000

# 生产启动
CMD ["npm", "run", "start"]