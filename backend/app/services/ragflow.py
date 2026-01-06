"""
RAGFlow 服务
实现 RAGFlow 的业务逻辑
"""
import json
import os
from typing import Dict, Any, Optional, List

from dotenv import load_dotenv
from ragflow_sdk import RAGFlow

# 加载环境变量
load_dotenv()


class RAGFlowService:
    """RAGFlow 服务类，封装所有与 RAGFlow 相关的业务逻辑"""

    def __init__(self):
        """初始化 RAGFlow 客户端"""
        self.api_key = os.getenv("RAGFLOW_API_KEY")
        self.base_url = os.getenv("RAGFLOW_BASE_URL")
        self.rag_client = RAGFlow(api_key=self.api_key, base_url=self.base_url)

        # 会话缓存（生产环境建议使用 Redis）
        self.sessions_cache: Dict[str, Any] = {}

    @staticmethod
    def safe_get_attr(obj, attr: str, default=''):
        """
        安全获取对象属性或字典键值

        Args:
            obj: 对象或字典
            attr: 属性名或键名
            default: 默认值

        Returns:
            属性值或默认值
        """
        if isinstance(obj, dict):
            return obj.get(attr, default)
        return getattr(obj, attr, default)

    def extract_references(self, references_data) -> Optional[List[Dict[str, Any]]]:
        """
        提取并格式化引用信息

        Args:
            references_data: 原始引用数据

        Returns:
            格式化后的引用列表
        """
        if not references_data:
            return None

        references = []
        for ref in references_data:
            references.append({
                "content": self.safe_get_attr(ref, 'content', ''),
                "document_name": self.safe_get_attr(ref, 'document_name', '未知文档'),
                "document_id": self.safe_get_attr(ref, 'document_id', ''),
                "similarity": self.safe_get_attr(ref, 'similarity', 0),
                "dataset_id": self.safe_get_attr(ref, 'dataset_id', '')
            })
        return references if references else None

    def list_chats(self) -> List[Dict[str, Any]]:
        """
        列出所有聊天助手

        Returns:
            聊天助手列表
        """
        chats = self.rag_client.list_chats()
        return [
            {
                "id": chat.id,
                "name": chat.name,
                "description": getattr(chat, 'description', ''),
            }
            for chat in chats
        ]

    def create_session(self, chat_id: str, session_name: str = "New Session") -> Dict[str, str]:
        """
        创建新会话

        Args:
            chat_id: 聊天助手 ID
            session_name: 会话名称

        Returns:
            会话信息

        Raises:
            ValueError: 当找不到聊天助手时
        """
        chats = self.rag_client.list_chats(id=chat_id)
        if not chats:
            raise ValueError("Chat assistant not found")

        chat = chats[0]
        session = chat.create_session(name=session_name)

        # 缓存会话对象
        self.sessions_cache[session.id] = session

        return {
            "session_id": session.id,
            "session_name": session.name,
            "chat_id": chat_id
        }

    def chat(self, question: str, chat_id: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        非流式聊天

        Args:
            question: 用户问题
            chat_id: 聊天助手 ID
            session_id: 会话 ID（可选）

        Returns:
            聊天响应数据

        Raises:
            ValueError: 当找不到聊天助手时
        """
        # 获取或创建会话
        if session_id and session_id in self.sessions_cache:
            session = self.sessions_cache[session_id]
        else:
            chats = self.rag_client.list_chats(id=chat_id)
            if not chats:
                raise ValueError("Chat assistant not found")

            chat = chats[0]
            session = chat.create_session()
            self.sessions_cache[session.id] = session

        # 调用 RAGFlow 进行对话
        response = session.ask(question=question, stream=False)

        # 提取内容和引用
        content = self.safe_get_attr(response, 'content', '')
        references = self.extract_references(
            self.safe_get_attr(response, 'reference', None)
        )

        return {
            "answer": content,
            "session_id": session.id,
            "references": references
        }

    async def chat_stream(self, question: str, chat_id: str, session_id: Optional[str] = None):
        """
        流式聊天生成器

        Args:
            question: 用户问题
            chat_id: 聊天助手 ID
            session_id: 会话 ID（可选）

        Yields:
            Server-Sent Events 格式的数据块
        """
        try:
            # 获取或创建会话
            if session_id and session_id in self.sessions_cache:
                session = self.sessions_cache[session_id]
            else:
                chats = self.rag_client.list_chats(id=chat_id)
                if not chats:
                    yield f"data: {json.dumps({'error': 'Chat assistant not found'})}\n\n"
                    return

                chat = chats[0]
                session = chat.create_session()
                self.sessions_cache[session.id] = session

            # 流式对话
            full_content = ""
            references = None

            for chunk in session.ask(question=question, stream=True):
                content = self.safe_get_attr(chunk, 'content', '')

                # 提取新增内容
                new_content = content[len(full_content):]
                full_content = content

                # 提取引用信息
                chunk_references = self.safe_get_attr(chunk, 'reference', None)
                if chunk_references:
                    references = self.extract_references(chunk_references)

                # 发送数据块
                data = {
                    "content": new_content,
                    "session_id": session.id,
                    "references": references
                }
                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

            # 发送结束标记
            yield f"data: {json.dumps({'done': True})}\n\n"

        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"Stream error: {error_detail}")
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    def list_datasets(self) -> List[Dict[str, Any]]:
        """
        列出所有数据集

        Returns:
            数据集列表
        """
        datasets = self.rag_client.list_datasets()
        return [
            {
                "id": ds.id,
                "name": ds.name,
                "chunk_count": ds.chunk_count,
                "document_count": ds.document_count
            }
            for ds in datasets
        ]

    def create_dataset(
            self,
            name: str,
            description: Optional[str] = None,
            chunk_method: str = "naive"
    ) -> Dict[str, str]:
        """
        创建数据集

        Args:
            name: 数据集名称
            description: 数据集描述
            chunk_method: 分块方法

        Returns:
            数据集信息
        """
        dataset = self.rag_client.create_dataset(
            name=name,
            description=description,
            chunk_method=chunk_method
        )

        return {
            "id": dataset.id,
            "name": dataset.name
        }

    def list_documents(self, dataset_id: str) -> List[Dict[str, Any]]:
        """
        列出数据集中的文档

        Args:
            dataset_id: 数据集 ID

        Returns:
            文档列表

        Raises:
            ValueError: 当找不到数据集时
        """
        datasets = self.rag_client.list_datasets(id=dataset_id)
        if not datasets:
            raise ValueError("Dataset not found")

        dataset = datasets[0]
        documents = dataset.list_documents()

        return [
            {
                "id": doc.id,
                "name": doc.name,
                "chunk_count": doc.chunk_count,
                "status": doc.run
            }
            for doc in documents
        ]

    def upload_document(self, dataset_id: str, display_name: str, content: str):
        """
        上传文档到数据集

        Args:
            dataset_id: 数据集 ID
            display_name: 文档显示名称
            content: 文档内容

        Raises:
            ValueError: 当找不到数据集时
        """
        datasets = self.rag_client.list_datasets(id=dataset_id)
        if not datasets:
            raise ValueError("Dataset not found")

        dataset = datasets[0]

        # 上传文档
        dataset.upload_documents([
            {
                "display_name": display_name,
                "blob": content.encode() if isinstance(content, str) else content
            }
        ])