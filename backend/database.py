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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            job VARCHAR(100),
            salary INTEGER,
            tax_rate FLOAT,
            monthly_income FLOAT,
            location VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budgets (
            id SERIAL PRIMARY KEY,
            simulation_id INTEGER REFERENCES simulations(id),
            month_number INTEGER,
            housing FLOAT,
            transport FLOAT,
            food FLOAT,
            utilities FLOAT,
            entertainment FLOAT,
            savings FLOAT,
            total_spent FLOAT,
            remaining FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("Database initialized!")
