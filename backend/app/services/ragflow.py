"""
RAGFlow Service Layer
业务逻辑层，封装所有与RAGFlow API的交互
"""

import requests
from typing import Optional, List, Dict, Any, Union
from pathlib import Path
import logging
import json

logger = logging.getLogger(__name__)


class RAGFlowServiceError(Exception):
    """RAGFlow服务异常"""
    pass


class RAGFlowService:
    """RAGFlow服务类，处理所有与RAGFlow API的交互"""

    def __init__(self, base_url: str, api_key: str):
        """
        初始化RAGFlow服务

        Args:
            base_url: RAGFlow API基础URL
            api_key: API密钥
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        logger.info(f"RAGFlow服务初始化完成: {base_url}")

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """
        统一处理API响应

        Args:
            response: requests响应对象

        Returns:
            解析后的JSON数据

        Raises:
            RAGFlowServiceError: API调用失败时抛出
        """
        try:
            data = response.json()
        except Exception as e:
            logger.error(f"解析响应JSON失败: {e}")
            raise RAGFlowServiceError(f"解析响应失败: {str(e)}")

        # 检查业务状态码
        if data.get("code") != 0:
            error_msg = data.get("message", "未知错误")
            logger.error(f"API调用失败: code={data.get('code')}, message={error_msg}")
            raise RAGFlowServiceError(error_msg)

        return data

    def create_dataset(
            self,
            name: str,
            avatar: Optional[str] = None,
            description: Optional[str] = None,
            embedding_model: Optional[str] = None,
            permission: str = "me",
            chunk_method: Optional[str] = None,
            parser_config: Optional[Dict[str, Any]] = None,
            parse_type: Optional[int] = None,
            pipeline_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        创建知识库

        Args:
            name: 知识库名称
            avatar: Base64编码的头像
            description: 知识库描述
            embedding_model: 嵌入模型名称
            permission: 访问权限 ("me" 或 "team")
            chunk_method: 分块方法
            parser_config: 解析器配置
            parse_type: 管道解析类型
            pipeline_id: 摄取管道ID

        Returns:
            包含知识库信息的字典

        Raises:
            RAGFlowServiceError: 创建失败时抛出
        """
        logger.info(f"开始创建知识库: {name}")

        url = f"{self.base_url}/api/v1/datasets"
        payload = {"name": name}

        if avatar:
            payload["avatar"] = avatar
        if description:
            payload["description"] = description
        if embedding_model:
            payload["embedding_model"] = embedding_model
        if permission:
            payload["permission"] = permission

        # 参数互斥性检查
        if chunk_method and (parse_type is not None or pipeline_id is not None):
            raise RAGFlowServiceError(
                "chunk_method 与 parse_type/pipeline_id 互斥"
            )

        if chunk_method:
            payload["chunk_method"] = chunk_method
            if parser_config:
                payload["parser_config"] = parser_config
        elif parse_type is not None and pipeline_id is not None:
            payload["parse_type"] = parse_type
            payload["pipeline_id"] = pipeline_id
        elif parse_type is not None or pipeline_id is not None:
            raise RAGFlowServiceError(
                "parse_type 和 pipeline_id 必须同时指定"
            )

        try:
            response = requests.post(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info(f"知识库创建成功: {result['data']['id']}")
            return result
        except requests.RequestException as e:
            logger.error(f"创建知识库网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def upload_documents(
            self,
            dataset_id: str,
            file_paths: Union[str, List[str]]
    ) -> Dict[str, Any]:
        """
        上传文档到知识库

        Args:
            dataset_id: 知识库ID
            file_paths: 文件路径（单个或列表）

        Returns:
            包含上传结果的字典

        Raises:
            RAGFlowServiceError: 上传失败时抛出
        """
        logger.info(f"开始上传文档到知识库: {dataset_id}")

        url = f"{self.base_url}/api/v1/datasets/{dataset_id}/documents"

        # 统一处理为列表
        if isinstance(file_paths, str):
            file_paths = [file_paths]

        # 准备文件
        files = []
        file_handles = []

        try:
            for file_path in file_paths:
                path = Path(file_path)
                if not path.exists():
                    raise RAGFlowServiceError(f"文件不存在: {file_path}")

                file_handle = open(file_path, 'rb')
                file_handles.append(file_handle)
                files.append(
                    ('file', (path.name, file_handle, 'application/octet-stream'))
                )

            headers = {'Authorization': f'Bearer {self.api_key}'}
            response = requests.post(url, headers=headers, files=files)
            result = self._handle_response(response)

            logger.info(f"文档上传成功，共 {len(result['data'])} 个文件")
            return result

        except requests.RequestException as e:
            logger.error(f"上传文档网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")
        finally:
            # 确保关闭所有文件句柄
            for fh in file_handles:
                fh.close()

    def parse_documents(
            self,
            dataset_id: str,
            document_ids: List[str]
    ) -> Dict[str, Any]:
        """
        解析文档

        Args:
            dataset_id: 知识库ID
            document_ids: 文档ID列表

        Returns:
            包含解析结果的字典

        Raises:
            RAGFlowServiceError: 解析失败时抛出
        """
        logger.info(f"开始解析文档: 知识库={dataset_id}, 文档数={len(document_ids)}")

        url = f"{self.base_url}/api/v1/datasets/{dataset_id}/chunks"
        payload = {"document_ids": document_ids}

        try:
            response = requests.post(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info("文档解析请求已提交")
            return result
        except requests.RequestException as e:
            logger.error(f"解析文档网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def delete_documents(
            self,
            dataset_id: str,
            document_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        删除文档

        Args:
            dataset_id: 知识库ID
            document_ids: 文档ID列表（None表示删除所有）

        Returns:
            包含删除结果的字典

        Raises:
            RAGFlowServiceError: 删除失败时抛出
        """
        logger.info(f"开始删除文档: 知识库={dataset_id}")

        url = f"{self.base_url}/api/v1/datasets/{dataset_id}/documents"
        payload = {}

        if document_ids is not None:
            payload["ids"] = document_ids
            logger.info(f"删除指定文档: {len(document_ids)} 个")
        else:
            logger.warning("删除知识库中所有文档")

        try:
            response = requests.delete(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info("文档删除成功")
            return result
        except requests.RequestException as e:
            logger.error(f"删除文档网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def create_chat_assistant(
            self,
            name: str,
            dataset_ids: Optional[List[str]] = None,
            avatar: Optional[str] = None,
            llm: Optional[Dict[str, Any]] = None,
            prompt: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建聊天助手

        Args:
            name: 助手名称
            dataset_ids: 关联的知识库ID列表
            avatar: Base64编码的头像
            llm: LLM配置
            prompt: 提示配置

        Returns:
            包含助手信息的字典

        Raises:
            RAGFlowServiceError: 创建失败时抛出
        """
        logger.info(f"开始创建聊天助手: {name}")

        url = f"{self.base_url}/api/v1/chats"
        payload = {"name": name}

        if dataset_ids is not None:
            payload["dataset_ids"] = dataset_ids
            logger.info(f"关联知识库数量: {len(dataset_ids)}")
        if avatar:
            payload["avatar"] = avatar
        if llm:
            payload["llm"] = llm
        if prompt:
            payload["prompt"] = prompt

        try:
            response = requests.post(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info(f"聊天助手创建成功: {result['data']['id']}")
            return result
        except requests.RequestException as e:
            logger.error(f"创建聊天助手网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def create_session(
            self,
            chat_id: str,
            name: Optional[str] = None,
            user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        创建聊天会话

        Args:
            chat_id: 聊天助手ID
            name: 会话名称
            user_id: 用户自定义ID

        Returns:
            包含会话信息的字典

        Raises:
            RAGFlowServiceError: 创建失败时抛出
        """
        logger.info(f"开始创建会话: 助手={chat_id}, 名称={name}")

        url = f"{self.base_url}/api/v1/chats/{chat_id}/sessions"
        payload = {}

        if name:
            payload["name"] = name
        if user_id:
            payload["user_id"] = user_id

        try:
            response = requests.post(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info(f"会话创建成功: {result['data']['id']}")
            return result
        except requests.RequestException as e:
            logger.error(f"创建会话网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    # def get_dataset_info(self, dataset_id: str) -> Dict[str, Any]:
    #     """
    #     获取知识库信息（扩展功能）
    #
    #     Args:
    #         dataset_id: 知识库ID
    #
    #     Returns:
    #         知识库信息
    #     """
    #     logger.info(f"获取知识库信息: {dataset_id}")
    #     url = f"{self.base_url}/api/v1/datasets/{dataset_id}"
    #
    #     try:
    #         response = requests.get(url, headers=self.headers)
    #         return self._handle_response(response)
    #     except requests.RequestException as e:
    #         logger.error(f"获取知识库信息失败: {e}")
    #         raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    """
    RAGFlow Service 补充代码
    """

    # ==================== 聊天助手管理 ====================

    def update_chat_assistant(
            self,
            chat_id: str,
            name: str,
            dataset_ids: Optional[List[str]] = None,
            avatar: Optional[str] = None,
            llm: Optional[Dict[str, Any]] = None,
            prompt: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        更新聊天助手配置

        Args:
            chat_id: 聊天助手ID
            name: 助手名称（必填）
            dataset_ids: 关联的知识库ID列表
            avatar: Base64编码的头像
            llm: LLM配置
            prompt: 提示配置

        Returns:
            包含 {"code": 0} 的字典

        Raises:
            RAGFlowServiceError: 更新失败时抛出
        """
        logger.info(f"开始更新聊天助手: chat_id={chat_id}, name={name}")

        url = f"{self.base_url}/api/v1/chats/{chat_id}"
        payload: Dict[str, Any] = {"name": name}

        if dataset_ids is not None:
            payload["dataset_ids"] = dataset_ids
        if avatar is not None:
            payload["avatar"] = avatar
        if llm is not None:
            payload["llm"] = llm
        if prompt is not None:
            payload["prompt"] = prompt

        try:
            response = requests.put(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info(f"聊天助手更新成功: chat_id={chat_id}")
            return result
        except requests.RequestException as e:
            logger.error(f"更新聊天助手网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def delete_chat_assistants(
            self,
            ids: Optional[List[str]] = None,
            delete_all: bool = False
    ) -> Dict[str, Any]:
        """
        删除聊天助手

        Args:
            ids: 要删除的助手ID列表；为 None / 空列表时配合 delete_all 使用
            delete_all: 是否删除当前用户所有助手（ids 为空时生效）

        Returns:
            包含 {"code": 0} 的字典

        Raises:
            RAGFlowServiceError: 删除失败时抛出
        """
        logger.info(f"开始删除聊天助手: ids={ids}, delete_all={delete_all}")

        url = f"{self.base_url}/api/v1/chats"
        payload: Dict[str, Any] = {}

        if ids:
            payload["ids"] = ids
            logger.info(f"删除指定助手: {len(ids)} 个")
        elif delete_all:
            payload["delete_all"] = True
            logger.warning("删除当前用户所有聊天助手")
        else:
            # ids 为空且 delete_all=False，根据文档不会删除任何助手
            payload["ids"] = []

        try:
            response = requests.delete(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info("聊天助手删除成功")
            return result
        except requests.RequestException as e:
            logger.error(f"删除聊天助手网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def list_chat_assistants(
            self,
            page: int = 1,
            page_size: int = 30,
            orderby: str = "create_time",
            desc: bool = True,
            name: Optional[str] = None,
            chat_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        列出聊天助手

        Args:
            page: 页码（默认1）
            page_size: 每页数量（默认30）
            orderby: 排序字段，可选 "create_time" / "update_time"
            desc: 是否降序（默认True）
            name: 按助手名称过滤
            chat_id: 按助手ID过滤

        Returns:
            包含助手列表的字典

        Raises:
            RAGFlowServiceError: 查询失败时抛出
        """
        logger.info(f"列出聊天助手: page={page}, page_size={page_size}")

        url = f"{self.base_url}/api/v1/chats"
        params: Dict[str, Any] = {
            "page": page,
            "page_size": page_size,
            "orderby": orderby,
            "desc": str(desc).lower()
        }

        if name is not None:
            params["name"] = name
        if chat_id is not None:
            params["id"] = chat_id

        try:
            response = requests.get(url, headers=self.headers, params=params)
            result = self._handle_response(response)
            data_list = result.get("data", [])
            logger.info(f"获取到 {len(data_list)} 个聊天助手")
            return result
        except requests.RequestException as e:
            logger.error(f"列出聊天助手网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    # ==================== 会话管理 ====================

    def update_session(
            self,
            chat_id: str,
            session_id: str,
            name: str,
            user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        更新聊天助手的会话

        Args:
            chat_id: 聊天助手ID
            session_id: 会话ID
            name: 会话新名称（必填）
            user_id: 用户自定义ID

        Returns:
            包含 {"code": 0} 的字典

        Raises:
            RAGFlowServiceError: 更新失败时抛出
        """
        logger.info(f"开始更新会话: chat_id={chat_id}, session_id={session_id}, name={name}")

        url = f"{self.base_url}/api/v1/chats/{chat_id}/sessions/{session_id}"
        payload: Dict[str, Any] = {"name": name}

        if user_id is not None:
            payload["user_id"] = user_id

        try:
            response = requests.put(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info(f"会话更新成功: session_id={session_id}")
            return result
        except requests.RequestException as e:
            logger.error(f"更新会话网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def list_sessions(
            self,
            chat_id: str,
            page: int = 1,
            page_size: int = 30,
            orderby: str = "create_time",
            desc: bool = True,
            name: Optional[str] = None,
            session_id: Optional[str] = None,
            user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        列出指定聊天助手的所有会话

        Args:
            chat_id: 聊天助手ID
            page: 页码（默认1）
            page_size: 每页数量（默认30）
            orderby: 排序字段，可选 "create_time" / "update_time"
            desc: 是否降序（默认True）
            name: 按会话名称过滤
            session_id: 按会话ID过滤
            user_id: 按用户自定义ID过滤

        Returns:
            包含会话列表的字典

        Raises:
            RAGFlowServiceError: 查询失败时抛出
        """
        logger.info(f"列出会话: chat_id={chat_id}, page={page}, page_size={page_size}")

        url = f"{self.base_url}/api/v1/chats/{chat_id}/sessions"
        params: Dict[str, Any] = {
            "page": page,
            "page_size": page_size,
            "orderby": orderby,
            "desc": str(desc).lower()
        }

        if name is not None:
            params["name"] = name
        if session_id is not None:
            params["id"] = session_id
        if user_id is not None:
            params["user_id"] = user_id

        try:
            response = requests.get(url, headers=self.headers, params=params)
            result = self._handle_response(response)
            data_list = result.get("data", [])
            logger.info(f"获取到 {len(data_list)} 个会话")
            return result
        except requests.RequestException as e:
            logger.error(f"列出会话网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def delete_sessions(
            self,
            chat_id: str,
            ids: Optional[List[str]] = None,
            delete_all: bool = False
    ) -> Dict[str, Any]:
        """
        删除指定聊天助手的会话

        Args:
            chat_id: 聊天助手ID
            ids: 要删除的会话ID列表；为 None / 空列表时配合 delete_all 使用
            delete_all: 是否删除该助手下所有会话（ids 为空时生效）

        Returns:
            包含 {"code": 0} 的字典

        Raises:
            RAGFlowServiceError: 删除失败时抛出
        """
        logger.info(f"开始删除会话: chat_id={chat_id}, ids={ids}, delete_all={delete_all}")

        url = f"{self.base_url}/api/v1/chats/{chat_id}/sessions"
        payload: Dict[str, Any] = {}

        if ids:
            payload["ids"] = ids
            logger.info(f"删除指定会话: {len(ids)} 个")
        elif delete_all:
            payload["delete_all"] = True
            logger.warning(f"删除助手 {chat_id} 下所有会话")
        else:
            payload["ids"] = []

        try:
            response = requests.delete(url, headers=self.headers, json=payload)
            result = self._handle_response(response)
            logger.info("会话删除成功")
            return result
        except requests.RequestException as e:
            logger.error(f"删除会话网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def list_datasets(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        列出所有知识库（扩展功能）

        Args:
            page: 页码
            page_size: 每页数量

        Returns:
            知识库列表
        """
        logger.info(f"列出知识库: page={page}, page_size={page_size}")
        url = f"{self.base_url}/api/v1/datasets"
        params = {"page": page, "page_size": page_size}

        try:
            response = requests.get(url, headers=self.headers, params=params)
            return self._handle_response(response)
        except requests.RequestException as e:
            logger.error(f"列出知识库失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def get_document_status(
            self,
            document_id: str,
            dataset_id: str
    ) -> Optional[str]:
        """
        查询文档解析状态

        Args:
            document_id: 文档ID
            dataset_id: 知识库ID

        Returns:
            文档状态字符串，可能的值：
            - "UNSTART": 未开始
            - "RUNNING": 解析中
            - "CANCEL": 已取消
            - "DONE": 解析完成
            - "FAIL": 解析失败
            - None: 未找到文档或查询失败

        Raises:
            RAGFlowServiceError: 查询失败时抛出
        """
        logger.info(f"查询文档状态: 知识库={dataset_id}, 文档={document_id}")

        url = f"{self.base_url}/api/v1/datasets/{dataset_id}/documents"
        params = {
            "id": document_id,
            "page": 1,
            "page_size": 1,
            "run": ["UNSTART", "RUNNING", "CANCEL", "DONE", "FAIL"]
        }

        try:
            response = requests.get(url, headers=self.headers, params=params)
            result = self._handle_response(response)

            # 获取文档列表
            docs = result.get("data", {}).get("docs", [])

            if not docs:
                logger.warning(f"未找到文档: document_id={document_id}")
                return None

            # 返回文档的解析状态
            status = docs[0].get("run")
            logger.info(f"文档状态: {status}")
            return status

        except requests.RequestException as e:
            logger.error(f"查询文档状态网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def get_documents_list(
            self,
            dataset_id: str,
            page: int = 1,
            page_size: int = 10,
            status_filter: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        获取知识库中的文档列表

        Args:
            dataset_id: 知识库ID
            page: 页码
            page_size: 每页数量
            status_filter: 状态过滤，可选值: UNSTART, RUNNING, CANCEL, DONE, FAIL

        Returns:
            包含文档列表的字典
        """
        logger.info(f"获取文档列表: 知识库={dataset_id}, page={page}")

        url = f"{self.base_url}/api/v1/datasets/{dataset_id}/documents"
        params = {
            "page": page,
            "page_size": page_size
        }

        if status_filter:
            params["run"] = status_filter

        try:
            response = requests.get(url, headers=self.headers, params=params)
            result = self._handle_response(response)
            logger.info(f"获取到 {len(result.get('data', {}).get('docs', []))} 个文档")
            return result
        except requests.RequestException as e:
            logger.error(f"获取文档列表失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def check_dataset_ready(
            self,
            dataset_id: str
    ) -> Dict[str, Any]:
        """
        检查知识库是否已准备好（所有文档都已解析完成）

        Args:
            dataset_id: 知识库ID

        Returns:
            包含就绪状态的字典:
            {
                "ready": bool,  # 是否已就绪
                "total": int,   # 总文档数
                "done": int,    # 已完成数
                "running": int, # 解析中数
                "failed": int,  # 失败数
                "documents": list  # 文档状态详情
            }
        """
        logger.info(f"检查知识库就绪状态: {dataset_id}")

        try:
            # 获取所有文档
            result = self.get_documents_list(
                dataset_id=dataset_id,
                page=1,
                page_size=1000  # 获取所有文档
            )

            docs = result.get("data", {}).get("docs", [])
            total = len(docs)

            # 统计各状态文档数量
            status_count = {
                "DONE": 0,
                "RUNNING": 0,
                "FAIL": 0,
                "UNSTART": 0,
                "CANCEL": 0
            }

            documents_status = []
            for doc in docs:
                status = doc.get("run", "UNKNOWN")
                status_count[status] = status_count.get(status, 0) + 1
                documents_status.append({
                    "id": doc.get("id"),
                    "name": doc.get("name"),
                    "status": status
                })

            # 判断是否就绪：所有文档都是DONE状态
            ready = total > 0 and status_count["DONE"] == total

            result_info = {
                "ready": ready,
                "total": total,
                "done": status_count["DONE"],
                "running": status_count["RUNNING"],
                "failed": status_count["FAIL"],
                "unstart": status_count["UNSTART"],
                "cancel": status_count["CANCEL"],
                "documents": documents_status
            }

            logger.info(
                f"知识库状态: ready={ready}, "
                f"total={total}, done={status_count['DONE']}, "
                f"running={status_count['RUNNING']}, failed={status_count['FAIL']}"
            )

            return result_info

        except Exception as e:
            logger.error(f"检查知识库就绪状态失败: {e}")
            raise RAGFlowServiceError(f"检查就绪状态失败: {str(e)}")

    def chat_with_assistant(
            self,
            chat_id: str,
            question: str,
            session_id: Optional[str] = None,
            stream: bool = True,
            user_id: Optional[str] = None,
            metadata_condition: Optional[Dict[str, Any]] = None
    ) -> Union[Dict[str, Any], Any]:
        """
        与聊天助手对话

        Args:
            chat_id: 聊天助手ID
            question: 用户问题
            session_id: 会话ID（可选，不提供则创建新会话）
            stream: 是否使用流式输出（默认True）
            user_id: 用户自定义ID（仅在未提供session_id时有效）
            metadata_condition: 元数据过滤条件

        Returns:
            如果stream=False，返回完整响应字典
            如果stream=True，返回生成器对象

        Raises:
            RAGFlowServiceError: 对话失败时抛出
        """
        logger.info(f"开始对话: chat_id={chat_id}, question={question[:50]}...")

        url = f"{self.base_url}/api/v1/chats/{chat_id}/completions"

        payload = {
            "question": question,
            "stream": stream
        }

        if session_id:
            payload["session_id"] = session_id
        if user_id:
            payload["user_id"] = user_id
        if metadata_condition:
            payload["metadata_condition"] = metadata_condition

        try:
            if stream:
                # 流式响应
                response = requests.post(
                    url,
                    headers=self.headers,
                    json=payload,
                    stream=True,
                    timeout=60
                )

                if response.status_code != 200:
                    logger.error(f"对话请求失败: {response.status_code}")
                    raise RAGFlowServiceError(f"对话请求失败: {response.status_code}")

                return self._stream_response(response)
            else:
                # 非流式响应
                response = requests.post(
                    url,
                    headers=self.headers,
                    json=payload,
                    timeout=60
                )

                result = self._handle_response(response)
                logger.info("对话完成")
                return result

        except requests.RequestException as e:
            logger.error(f"对话网络请求失败: {e}")
            raise RAGFlowServiceError(f"网络请求失败: {str(e)}")

    def _stream_response(self, response: requests.Response):
        """
        处理流式响应

        Args:
            response: 流式响应对象

        Yields:
            每次流式更新的数据
        """
        try:
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')

                    # 跳过空行
                    if not line_str.strip():
                        continue

                    # 处理 data: 开头的行
                    if line_str.startswith('data:'):
                        data_str = line_str[5:].strip()

                        # 跳过空数据
                        if not data_str:
                            continue

                        try:
                            data = json.loads(data_str)
                            yield data
                        except json.JSONDecodeError as e:
                            logger.warning(f"解析流式数据失败: {e}, 数据: {data_str}")
                            continue

        except Exception as e:
            logger.error(f"处理流式响应失败: {e}")
            raise RAGFlowServiceError(f"处理流式响应失败: {str(e)}")