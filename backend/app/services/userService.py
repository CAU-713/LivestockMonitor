import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import settings


def get_db_connection():
    """
    Create and return a database connection
    """
    conn = psycopg2.connect(
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        user=settings.db_user,
        password=settings.db_password
    )
    return conn


def get_all_users():
    """
    Fetch all records from user_table
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute("SELECT * FROM user_table")
        users = cursor.fetchall()
        return [dict(user) for user in users]
    finally:
        cursor.close()
        conn.close()
