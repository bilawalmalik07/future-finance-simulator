from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db, init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


class UsernameRequest(BaseModel):
    username: str


@app.get("/")
def home():
    return {"message": "Future Finance Simulator API running!"}


@app.get("/api/auth/check/{username}")
def check_username(username: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return {"available": user is None}


@app.post("/api/auth/signup")
def signup(data: UsernameRequest):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username) VALUES (%s) RETURNING id, username, created_at",
            (data.username,)
        )
        user = cursor.fetchone()
        conn.commit()
        return {
            "message": "Account created!",
            "user": {
                "id": user[0],
                "username": user[1],
                "created_at": str(user[2])
            }
        }
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Username already taken")
    finally:
        cursor.close()
        conn.close()


@app.post("/api/auth/login")
def login(data: UsernameRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, created_at FROM users WHERE username = %s",
        (data.username,)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="Username not found")
    return {
        "message": "Welcome back!",
        "user": {
            "id": user[0],
            "username": user[1],
            "created_at": str(user[2])
        }
    }
