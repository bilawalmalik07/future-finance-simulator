from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
from database import get_db, init_db
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")  # type: ignore
def startup():
    init_db()


class UsernameRequest(BaseModel):
    username: str


class BudgetRequest(BaseModel):
    simulation_id: int
    month_number: int
    housing: float
    transport: float
    food: float
    utilities: float
    entertainment: float


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


facts = [
    "The average American spends $1,200 a year on coffee",
    "Only 40% of Americans have enough savings for a $1,000 emergency",
    "Credit card debt in the US is over $1 trillion",
    "Saving just $5 a day = $1,825 a year",
    "Most millionaires drive used cars"
]


@app.get("/api/fun-fact")
def fun_fact():
    return {"fact": random.choice(facts)}


# ─── Career Generator ───────────────────────────

careers = [
    {"job": "Software Engineer", "salary": 95000, "tax_rate": 0.22},
    {"job": "Teacher", "salary": 45000, "tax_rate": 0.12},
    {"job": "Nurse", "salary": 65000, "tax_rate": 0.18},
    {"job": "Electrician", "salary": 58000, "tax_rate": 0.15},
    {"job": "Entrepreneur", "salary": 72000, "tax_rate": 0.20},
    {"job": "Graphic Designer", "salary": 52000, "tax_rate": 0.14},
    {"job": "Police Officer", "salary": 55000, "tax_rate": 0.15},
    {"job": "Accountant", "salary": 68000, "tax_rate": 0.18},
    {"job": "Chef", "salary": 42000, "tax_rate": 0.12},
    {"job": "Pharmacist", "salary": 88000, "tax_rate": 0.20},
]

locations = ["Chicago", "New York", "Austin", "Seattle", "Denver", "Miami"]


@app.post("/api/simulation/start/{user_id}")
def start_simulation(user_id: int):
    career = random.choice(careers)
    location = random.choice(locations)
    monthly_income = round(
        (career["salary"] * (1 - career["tax_rate"])) / 12, 2)

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO simulations (user_id, job, salary, tax_rate, monthly_income, location)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, job, salary, tax_rate, monthly_income, location
        """, (user_id, career["job"], career["salary"], career["tax_rate"], monthly_income, location))
        sim = cursor.fetchone()
        conn.commit()
        return {
            "message": "Career assigned!",
            "simulation": {
                "id": sim[0],
                "job": sim[1],
                "salary": sim[2],
                "tax_rate": sim[3],
                "monthly_income": sim[4],
                "location": sim[5]
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ─── Budget Engine ───────────────────────────

@app.post("/api/budget/submit")
def submit_budget(data: BudgetRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT monthly_income FROM simulations WHERE id = %s",
        (data.simulation_id,)
    )
    sim = cursor.fetchone()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")

    monthly_income = sim[0]
    total_spent = round(data.housing + data.transport +
                        data.food + data.utilities + data.entertainment, 2)
    remaining = round(monthly_income - total_spent, 2)
    savings = remaining if remaining > 0 else 0

    try:
        cursor.execute("""
            INSERT INTO budgets (simulation_id, month_number, housing, transport, food, utilities, entertainment, savings, total_spent, remaining)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (data.simulation_id, data.month_number, data.housing, data.transport,
              data.food, data.utilities, data.entertainment, savings, total_spent, remaining))
        budget = cursor.fetchone()
        conn.commit()
        return {
            "message": "Budget submitted!",
            "budget": {
                "id": budget[0],
                "monthly_income": monthly_income,
                "total_spent": total_spent,
                "savings": savings,
                "remaining": remaining,
                "overspent": remaining < 0
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ─── Credit Score System ───────────────────────────

@app.post("/api/credit/update/{simulation_id}")
def update_credit_score(simulation_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT monthly_income, total_spent, savings, remaining
        FROM budgets
        WHERE simulation_id = %s
        ORDER BY month_number DESC
        LIMIT 1
    """, (simulation_id,))
    budget = cursor.fetchone()

    if not budget:
        raise HTTPException(
            status_code=404, detail="No budget found for this simulation")

    monthly_income, total_spent, savings, remaining = budget

    cursor.execute("""
        SELECT score FROM credit_scores
        WHERE simulation_id = %s
        ORDER BY month_number DESC
        LIMIT 1
    """, (simulation_id,))
    current = cursor.fetchone()
    score = current[0] if current else 650

    cursor.execute("""
        SELECT month_number FROM budgets
        WHERE simulation_id = %s
        ORDER BY month_number DESC
        LIMIT 1
    """, (simulation_id,))
    month = cursor.fetchone()[0]

    change = 0
    reasons = []

    if remaining >= 0:
        change += 25
        reasons.append("Paid bills on time +25")
    else:
        change -= 50
        reasons.append("Overspent -50")

    if savings > 0:
        change += 10
        reasons.append("Has savings +10")
    else:
        change -= 20
        reasons.append("No savings -20")

    if (total_spent / monthly_income) <= 0.7:
        change += 15
        reasons.append("Spent under 70% of income +15")

    if monthly_income > 0 and (total_spent / monthly_income) > 0.5:
        change -= 10
        reasons.append("Spent over 50% of income -10")

    new_score = max(300, min(850, score + change))
    reason_text = ", ".join(reasons)

    if new_score >= 800:
        rating = "Excellent"
    elif new_score >= 700:
        rating = "Good"
    elif new_score >= 600:
        rating = "Fair"
    else:
        rating = "Poor"

    try:
        cursor.execute("""
            INSERT INTO credit_scores (simulation_id, month_number, score, change, reason)
            VALUES (%s, %s, %s, %s, %s)
        """, (simulation_id, month, new_score, change, reason_text))
        conn.commit()
        return {
            "message": "Credit score updated!",
            "credit": {
                "previous_score": score,
                "change": change,
                "new_score": new_score,
                "rating": rating,
                "reasons": reasons
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
