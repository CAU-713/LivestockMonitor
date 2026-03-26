"""
密码迁移脚本
将数据库中已有的明文密码加密为 bcrypt 哈希
在 main.py 启动时自动调用，确保存量数据得到迁移
"""

from passlib.context import CryptContext
from sqlmodel import Session, select, create_engine

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _is_bcrypt_hash(password: str) -> bool:
    """判断密码是否已经是 bcrypt 哈希格式"""
    return password.startswith("$2b$") or password.startswith("$2a$") or password.startswith("$2y$")


def migrate_plain_passwords(db_url: str) -> None:
    """
    将数据库中所有明文密码迁移为 bcrypt 哈希密码
    只处理未加密的密码（不以 $2b$/$2a$/$2y$ 开头的）
    """
    from app.models.UserDO import UserDO  # 避免循环导入

    engine = create_engine(db_url, echo=False)
    with Session(engine) as session:
        users = session.exec(select(UserDO)).all()
        migrated_count = 0
        for user in users:
            if user.password and not _is_bcrypt_hash(user.password):
                user.password = pwd_context.hash(user.password)
                session.add(user)
                migrated_count += 1
        if migrated_count > 0:
            session.commit()
            print(f"[密码迁移] 成功将 {migrated_count} 个用户的明文密码加密为 bcrypt 哈希")
        else:
            print("[密码迁移] 所有用户密码已是加密格式，无需迁移")
