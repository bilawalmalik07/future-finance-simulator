from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.staticfiles import StaticFiles  # type: ignore
from fastapi.responses import FileResponse  # type: ignore
from pydantic import BaseModel  # type: ignore
from database import get_db, init_db
import random
import os

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


# ─── API Routes ───────────────────────────

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
    "Most millionaires drive used cars",
    "78% of Americans live paycheck to paycheck",
    "The average student loan debt in the US is over $37,000",
    "Compound interest can double your money every 7-10 years",
    "Americans spend an average of $300/month eating out",
    "Having a budget makes you 20% more likely to reach financial goals",
    "The average car payment in the US is over $700/month",
    "Experts recommend keeping housing costs under 30% of your income",
    "Only 1 in 3 Americans tracks their spending regularly",
    "The 50/30/20 rule: 50% needs, 30% wants, 20% savings",
    "A credit score above 750 can save you thousands on loan interest",
    "The average American has 4 credit cards",
    "An emergency fund should cover 3-6 months of expenses",
    "Investing $100/month at 7% return = $120,000 in 30 years",
    "Americans waste an average of $500/year on unused subscriptions",
    "People with written financial goals are 42% more likely to achieve them",
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
    {"job": "Data Scientist", "salary": 105000, "tax_rate": 0.24},
    {"job": "Firefighter", "salary": 53000, "tax_rate": 0.15},
    {"job": "Dentist", "salary": 150000, "tax_rate": 0.28},
    {"job": "Plumber", "salary": 61000, "tax_rate": 0.16},
    {"job": "Marketing Manager", "salary": 78000, "tax_rate": 0.20},
    {"job": "Lawyer", "salary": 120000, "tax_rate": 0.26},
    {"job": "Journalist", "salary": 48000, "tax_rate": 0.13},
    {"job": "Architect", "salary": 85000, "tax_rate": 0.21},
    {"job": "Social Worker", "salary": 40000, "tax_rate": 0.12},
    {"job": "Pilot", "salary": 130000, "tax_rate": 0.26},
    {"job": "Real Estate Agent", "salary": 67000, "tax_rate": 0.18},
    {"job": "Mechanic", "salary": 50000, "tax_rate": 0.14},
    {"job": "Veterinarian", "salary": 98000, "tax_rate": 0.22},
    {"job": "UX Designer", "salary": 90000, "tax_rate": 0.21},
    {"job": "Truck Driver", "salary": 55000, "tax_rate": 0.15},
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

    cursor.execute("""
        SELECT savings FROM budgets
        WHERE simulation_id = %s AND month_number < %s
        ORDER BY month_number DESC
        LIMIT 1
    """, (data.simulation_id, data.month_number))
    prev_row = cursor.fetchone()
    prev_savings = float(prev_row[0]) if prev_row else 0.0

    savings = round(prev_savings + remaining, 2)
    in_debt = savings < 0

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
                "overspent": remaining < 0,
                "in_debt": in_debt,
                "debt_amount": abs(savings) if in_debt else 0
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

    cursor.execute(
        "SELECT monthly_income FROM simulations WHERE id = %s",
        (simulation_id,)
    )
    sim = cursor.fetchone()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    monthly_income = sim[0]

    cursor.execute("""
        SELECT total_spent, savings, remaining
        FROM budgets
        WHERE simulation_id = %s
        ORDER BY month_number DESC
        LIMIT 1
    """, (simulation_id,))
    budget = cursor.fetchone()

    if not budget:
        raise HTTPException(
            status_code=404, detail="No budget found for this simulation")

    total_spent, savings, remaining = budget

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
    elif savings < 0:
        change -= 40
        reasons.append(f"In debt (${abs(savings):.0f} owed) -40")
    else:
        change -= 20
        reasons.append("No savings -20")

    if (total_spent / monthly_income) <= 0.7:
        change += 15
        reasons.append("Spent under 70% of income +15")

    if monthly_income > 0 and (total_spent / monthly_income) > 0.5:
        change -= 10
        reasons.append("Spent over 50% of income -10")

    new_score = max(300, min(1000, score + change))
    reason_text = ", ".join(reasons)

    if new_score >= 950:
        rating = "Legendary"
    elif new_score >= 850:
        rating = "Excellent"
    elif new_score >= 750:
        rating = "Good"
    elif new_score >= 620:
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

# ─── Emergency Event Generator ───────────────────────────


emergency_events = [
    {"name": "Car Breakdown", "cost": 800,
        "description": "Your car broke down and needs urgent repairs."},
    {"name": "Medical Bill", "cost": 1500,
        "description": "Unexpected medical expense hit your wallet."},
    {"name": "Laptop Died", "cost": 600,
        "description": "Your laptop stopped working and needs replacement."},
    {"name": "Flood Damage", "cost": 2000,
        "description": "Water damage in your apartment needs fixing."},
    {"name": "Phone Stolen", "cost": 400,
        "description": "Your phone was stolen and needs replacement."},
    {"name": "Family Emergency", "cost": 1000,
        "description": "A family member needed urgent financial help."},
    {"name": "Pet Emergency", "cost": 700,
        "description": "Your pet needed emergency vet care."},
    {"name": "Roof Leak", "cost": 1800,
        "description": "A leaking roof needs immediate patching before it gets worse."},
    {"name": "Identity Theft", "cost": 900,
        "description": "Someone stole your identity and drained part of your account."},
    {"name": "Speeding Ticket", "cost": 350,
        "description": "You got pulled over and hit with a fine plus traffic school fees."},
    {"name": "Dental Emergency", "cost": 1200,
        "description": "A cracked tooth needs urgent dental work — no insurance coverage."},
    {"name": "Apartment Break-In", "cost": 750,
        "description": "Your place was broken into. New locks, door, and lost items add up."},
    {"name": "Appliance Failure", "cost": 500,
        "description": "Your refrigerator or washing machine broke down suddenly."},
    {"name": "Parking Tickets", "cost": 250,
        "description": "A stack of ignored parking tickets came back to haunt you."},
    {"name": "Flight Cancellation", "cost": 600,
        "description": "A last-minute trip for a family matter cost you big in rebooking fees."},
    {"name": "Flooded Basement", "cost": 2500,
        "description": "Heavy rain flooded your basement — cleanup and repairs aren't cheap."},
    {"name": "Tax Surprise", "cost": 1100,
        "description": "You owe more taxes than expected this quarter."},
    {"name": "Bike Stolen", "cost": 400,
        "description": "Your main way to get around was stolen overnight."},
    {"name": "Food Poisoning", "cost": 800,
        "description": "A bad meal sent you to urgent care and cost you a sick day of pay."},
    {"name": "Utility Spike", "cost": 300,
        "description": "An extreme weather month sent your electric bill through the roof."},
    {"name": "Lawsuit Fee", "cost": 1500,
        "description": "A minor dispute required a lawyer and court filing fees."},
    {"name": "Moving Costs", "cost": 1300,
        "description": "Your landlord raised rent and you had to move — movers aren't free."},
    {"name": "Glasses Broken", "cost": 350,
        "description": "Your prescription glasses snapped and need immediate replacement."},
    {"name": "Water Heater Bust", "cost": 900,
        "description": "No hot water until you replace the water heater — can't wait."},
    {"name": "Tree Damage", "cost": 1600,
        "description": "A storm knocked a tree onto your property, causing damage."},
]


@app.post("/api/events/trigger/{simulation_id}/{month_number}")
def trigger_event(simulation_id: int, month_number: int):
    conn = get_db()
    cursor = conn.cursor()

    if random.random() > 0.4:
        return {"message": "No event this month!", "event": None}

    event = random.choice(emergency_events)

    cursor.execute("""
        SELECT savings, remaining FROM budgets
        WHERE simulation_id = %s AND month_number = %s
    """, (simulation_id, month_number))
    budget = cursor.fetchone()

    if not budget:
        raise HTTPException(
            status_code=404, detail="Budget not found for this month")

    savings, remaining = budget
    new_savings = max(0, savings - event["cost"])
    impact = "savings wiped out!" if new_savings == 0 else f"lost ${event['cost']} from savings"

    try:
        cursor.execute("""
            INSERT INTO events (simulation_id, month_number, event_name, cost, description)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (simulation_id, month_number, event["name"], event["cost"], event["description"]))

        cursor.execute("""
            UPDATE budgets SET savings = %s WHERE simulation_id = %s AND month_number = %s
        """, (new_savings, simulation_id, month_number))

        conn.commit()
        return {
            "message": "Emergency event occurred!",
            "event": {
                "name": event["name"],
                "cost": event["cost"],
                "description": event["description"],
                "previous_savings": savings,
                "new_savings": new_savings,
                "impact": impact
            }
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ─── Simulation Year Summary ───────────────────────────

@app.get("/api/simulation/summary/{simulation_id}")
def get_simulation_summary(simulation_id: int):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COALESCE(SUM(savings), 0), COUNT(*) FROM budgets
        WHERE simulation_id = %s
    """, (simulation_id,))
    row = cursor.fetchone()
    total_savings = float(row[0])
    months_played = int(row[1])

    cursor.execute("""
        SELECT COALESCE(SUM(total_spent), 0) FROM budgets
        WHERE simulation_id = %s
    """, (simulation_id,))
    total_spent = float(cursor.fetchone()[0])

    cursor.execute("""
        SELECT COUNT(*) FROM budgets
        WHERE simulation_id = %s AND remaining < 0
    """, (simulation_id,))
    overspent_months = int(cursor.fetchone()[0])

    cursor.execute("""
        SELECT score FROM credit_scores
        WHERE simulation_id = %s
        ORDER BY month_number DESC LIMIT 1
    """, (simulation_id,))
    credit_row = cursor.fetchone()
    final_credit_score = credit_row[0] if credit_row else 650

    cursor.execute("""
        SELECT score FROM credit_scores
        WHERE simulation_id = %s
        ORDER BY month_number ASC LIMIT 1
    """, (simulation_id,))
    first_credit = cursor.fetchone()
    starting_credit_score = first_credit[0] if first_credit else 650

    cursor.close()
    conn.close()

    return {
        "total_savings": total_savings,
        "total_spent": total_spent,
        "months_played": months_played,
        "overspent_months": overspent_months,
        "final_credit_score": final_credit_score,
        "credit_change_overall": final_credit_score - starting_credit_score,
    }


# ─── Serve React Frontend ───────────────────────────

static_dir = os.path.join(os.path.dirname(__file__), "../frontend/dist")

if os.path.exists(static_dir):
    app.mount(
        "/assets", StaticFiles(directory=f"{static_dir}/assets"), name="assets")

    @app.get("/")
    def serve_root():
        return FileResponse(f"{static_dir}/index.html")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(f"{static_dir}/index.html")
