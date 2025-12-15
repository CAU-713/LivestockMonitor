from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatDO:
    """聊天助手数据对象"""

    def __init__(
            self,
            id: str,
            name: str,
            description: Optional[str] = None,
            avatar: Optional[str] = None,
            dataset_ids: Optional[List[str]] = None,
            created_at: Optional[datetime] = None
    ):
        self.id = id
        self.name = name
        self.description = description
        self.avatar = avatar
        self.dataset_ids = dataset_ids or []
        self.created_at = created_at or datetime.now()


class SessionDO:
    """会话数据对象"""

    def __init__(
            self,
            id: str,
            name: str,
            chat_id: str,
            messages: Optional[List[Dict[str, Any]]] = None,
            created_at: Optional[datetime] = None
    ):
        self.id = id
        self.name = name
        self.chat_id = chat_id
        self.messages = messages or []
        self.created_at = created_at or datetime.now()


class DatasetDO:
    """数据集数据对象"""

    def __init__(
            self,
            id: str,
            name: str,
            description: Optional[str] = None,
            chunk_count: int = 0,
            document_count: int = 0,
            created_at: Optional[datetime] = None
    ):
        self.id = id
        self.name = name
        self.description = description
        self.chunk_count = chunk_count
        self.document_count = document_count
        self.created_at = created_at or datetime.now()
