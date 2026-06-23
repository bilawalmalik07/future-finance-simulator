import psycopg2  # type: ignore
import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()


def get_db():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialized!")
