# 本地部署

1.1 配置好docker工具，复制一份根目录的.env.example文件重命名为.env文件(只是复制和重命名，不需要修改内容)

1.2 在文件夹下执行docker compose up，从而完成前后端和中间件的启动

2.1 如果是要后端开发则关闭前端的docker容器，并进行本地后端代码的启动(具体细节在下面)

2.2 如果是要前端开发则关闭后端的docker容器，并进行本地前端代码的启动(具体细节在下面)

3 访问 http://localhost:8000/docs  查看接口文档




# 后端代码的启动

## 1 创建python==3.12的环境并且安装依赖

在conda环境里创建环境

```
conda create -n LivestockMonitor python=3.12
```

进入backend文件夹下

```
pip install -r requirements.txt
```

## 2 打开并修改运行配置文件

![img.png](doc/img1.png)

![img.png](doc/img2.png)


# 前端代码的启动
## 1 安装nodejs环境
建议版本：v20.0.0 以上

## 2 进入frontend文件夹下安装依赖
```bash
cd frontend
npm install
```
## 3 打开并修改运行配置文件
![img.png](doc/img3.png)

![img.png](doc/img4.png)

分别运行install和dev




# docker一键部署

适用场景：在**服务器**上完整部署前端、后端、数据库、缓存等所有服务。

## 1 准备环境

确保服务器已安装：
- [Docker](https://docs.docker.com/get-docker/) v20.0+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+

```bash
docker --version
docker compose version
```

## 2 克隆项目

```bash
git clone git@github.com:CAU-713/LivestockMonitor.git
cd LivestockMonitor
```

## 3 配置环境变量

复制示例配置文件并按需修改：

```bash
cp .env.example .env
```

**必须修改的配置项：**

```ini

# 前端访问后端的地址（替换为你的服务器 IP 或域名）
BACKEND_URL=http://your_server_ip/api
```

> 注意：`.env` 中的 `DB_HOST=db` 保持不变，这是 Docker 内部网络的服务名称，无需修改。

## 4 启动所有服务

```bash
docker compose up -d
```

首次启动会自动拉取镜像并构建，需要几分钟时间。


服务启动后访问：
- 前端页面：`http://your_server_ip:3000`
- 后端接口文档：`http://your_server_ip:8000/docs`

## 5 常用运维命令

```bash
# 停止所有服务
docker compose down
# 停止所有服务并删除数据库里的数据
docker-compose down -v
# 更新代码后重新构建并启动
git pull
docker compose up -d --build

```
