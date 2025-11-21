# Livestock Monitor 后端开发文档

## 项目简介

这是一个基于 Python 的后端服务，用于牲畜监控系统。主要功能包括用户管理、视频流分析以及环境数据处理等。

本项目使用了以下技术栈：
- FastAPI：现代、快速（高性能）的 Web 框架
- SQLModel：用于数据库操作的 ORM 工具
- YOLOv8：用于目标检测的 AI 模型
- PostgreSQL：关系型数据库

访问 http://localhost:8000/docs 查看自动生成的 API 文档。


## 目录结构
```
backend/
├── app/                    # 主应用目录
│   ├── models/             # 数据模型定义
│   │   ├── __init__.py     # 模型导入初始化
│   │   └── userDO.py       # 用户数据对象
│   ├── routers/            # API 路由定义
│   │   ├── detectRouter.py # 检测相关路由
│   │   └── userRouter.py   # 用户相关路由
│   ├── schemas/            # 数据传输对象定义
│   │   └── userDTO.py      # 用户数据传输对象
│   ├── services/           # 业务逻辑实现
│   │   └── yolo.py         # YOLO 模型服务
│   ├── config.py           # 配置文件
│   └── main.py             # 应用入口
├── Dockerfile              # Docker 镜像配置
├── requirements.txt        # Python 依赖列表
└── README.md               # 项目文档
```

## 开发规范

### DO 与 DTO 规范

在本项目中，我们遵循清晰的数据对象分层规范，以确保代码的可维护性和可读性。
这种分离有助于：
1. 隐藏敏感信息（如密码）不被返回到前端
2. 在 API 接口层面明确数据格式
3. 解耦数据库模型与接口模型，提高系统的灵活性和安全性

#### DO (Data Object)
DO 是数据对象，直接映射数据库表结构。每个 DO 类对应数据库中的一张表，包含表的所有字段，并负责与数据库进行交互。DO 位于 `app/models` 目录下。

DO 位于 `app/models` 目录下，它们不包含任何业务逻辑，仅作为数据载体。

#### DTO (Data Transfer Object)
DTO 是数据传输对象，主要用于在不同层之间传递数据。根据不同的业务场景，我们会定义不同类型的 DTO：

- **UserCreateDTO**：用于创建用户时接收客户端传来的数据
- **UserReadDTO**：用于向客户端返回用户信息，隐藏敏感字段如密码
- **UserUpdateDTO**：用于更新用户信息，字段通常为可选

DTO 位于 `app/schemas` 目录下，它们不包含任何业务逻辑，仅作为数据载体。


## 开发指南

### 添加新的数据模型

1. 在 `app/models/` 目录下创建新的模型文件
2. 在 `app/models/__init__.py` 中导入新模型
3. 模型会自动被映射到数据库表

### 添加新的 API 接口

1. 在 `app/routers/` 目录下创建新的路由文件
2. 这个新的路由文件最后只负责一个功能模块，比如用户管理、视频检测等

### 添加新的业务逻辑

1. 在 `app/services/` 目录下创建新的服务文件
2. 在需要的地方引用并使用该服务


## 项目模块说明

### Models（数据模型）

位于 `app/models/` 目录中，定义了数据库表结构。
- `userDO.py`：用户数据对象，包含用户的基本信息

### Schemas（数据传输对象）

位于 `app/schemas/` 目录中，定义了 API 接口的数据格式。
- `userDTO.py`：包含用户创建、读取和更新的数据格式定义

### Routers（路由）

位于 `app/routers/` 目录中，定义了 API 接口。
- `userRouter.py`：用户相关的增删改查接口
- `detectRouter.py`：视频检测相关的接口

### Services（服务）

位于 `app/services/` 目录中，实现了具体的业务逻辑。
- `yolo.py`：YOLO 模型推理实现，用于视频流的目标检测

## API 接口介绍

### 用户管理接口

- `POST /users/`：创建新用户
- `GET /users/`：获取用户列表
- `GET /users/{user_id}`：获取特定用户信息
- `PATCH /users/{user_id}`：更新用户信息
- `DELETE /users/{user_id}`：删除用户

### 视频检测接口

- `GET /detect/infer`：实时视频流检测接口，返回 MJPEG 流




