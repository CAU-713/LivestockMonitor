from typing import Dict, List, Optional, Any, AsyncGenerator
from ragflow_sdk import RAGFlow
from app.config import settings
import json


class RAGFlowService:
    """RAGFlow 服务类"""

    def __init__(self):
        """初始化 RAGFlow 客户端"""
        self.client = RAGFlow(
            api_key=settings.RAGFLOW_API_KEY,
            base_url=settings.RAGFLOW_BASE_URL
        )
        self.sessions_cache: Dict[str, Any] = {}

    @staticmethod
    def safe_get_attr(obj, attr: str, default=''):
        """安全获取对象属性或字典键值"""
        if isinstance(obj, dict):
            return obj.get(attr, default)
        return getattr(obj, attr, default)

    @staticmethod
    def extract_references(references_data) -> Optional[List[Dict[str, Any]]]:
        """提取并格式化引用信息"""
        if not references_data:
            return None

        references = []
        for ref in references_data:
            references.append({
                "content": RAGFlowService.safe_get_attr(ref, 'content', ''),
                "document_name": RAGFlowService.safe_get_attr(ref, 'document_name', '未知文档'),
                "document_id": RAGFlowService.safe_get_attr(ref, 'document_id', ''),
                "similarity": RAGFlowService.safe_get_attr(ref, 'similarity', 0),
                "dataset_id": RAGFlowService.safe_get_attr(ref, 'dataset_id', '')
            })
        return references if references else None

    def list_chats(self, chat_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """列出聊天助手"""
        chats = self.client.list_chats(id=chat_id) if chat_id else self.client.list_chats()
        return [
            {
                "id": chat.id,
                "name": chat.name,
                "description": getattr(chat, 'description', '')
            }
            for chat in chats
        ]

    def create_session(self, chat_id: str, session_name: str = "New Session") -> Dict[str, Any]:
        """创建会话"""
        chats = self.client.list_chats(id=chat_id)
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

    def get_or_create_session(self, chat_id: str, session_id: Optional[str] = None):
        """获取或创建会话"""
        if session_id and session_id in self.sessions_cache:
            return self.sessions_cache[session_id]

        chats = self.client.list_chats(id=chat_id)
        if not chats:
            raise ValueError("Chat assistant not found")

        chat = chats[0]
        session = chat.create_session()
        self.sessions_cache[session.id] = session

        return session

    def chat(
            self,
            question: str,
            chat_id: str,
            session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """非流式对话"""
        session = self.get_or_create_session(chat_id, session_id)

        # 调用 RAGFlow 进行对话
        response = session.ask(question=question, stream=False)

        # 提取内容和引用
        content = self.safe_get_attr(response, 'content', '')
        references = self.extract_references(self.safe_get_attr(response, 'reference', None))

        return {
            "answer": content,
            "session_id": session.id,
            "references": references
        }

    async def chat_stream(
            self,
            question: str,
            chat_id: str,
            session_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """流式对话"""
        session = self.get_or_create_session(chat_id, session_id)

        full_content = ""
        references = None

        for chunk in session.ask(question=question, stream=True):
            # 安全获取内容
            content = self.safe_get_attr(chunk, 'content', '')

            # 提取新增内容
            new_content = content[len(full_content):]
            full_content = content

            # 提取引用信息
            chunk_references = self.safe_get_attr(chunk, 'reference', None)
            if chunk_references:
                references = self.extract_references(chunk_references)

            # 生成数据块
            data = {
                "content": new_content,
                "session_id": session.id,
                "references": references
            }
            yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

        # 发送结束标记
        yield f"data: {json.dumps({'done': True})}\n\n"

    def list_datasets(self, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """列出数据集"""
        datasets = self.client.list_datasets(id=dataset_id) if dataset_id else self.client.list_datasets()
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
    ) -> Dict[str, Any]:
        """创建数据集"""
        dataset = self.client.create_dataset(
            name=name,
            description=description,
            chunk_method=chunk_method
        )

        return {
            "id": dataset.id,
            "name": dataset.name
        }

    def list_documents(self, dataset_id: str) -> List[Dict[str, Any]]:
        """列出数据集中的文档"""
        datasets = self.client.list_datasets(id=dataset_id)
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

    def upload_document(
            self,
            dataset_id: str,
            display_name: str,
            content: str
    ) -> Dict[str, str]:
        """上传文档到数据集"""
        datasets = self.client.list_datasets(id=dataset_id)
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

        return {"message": "Document uploaded successfully"}

