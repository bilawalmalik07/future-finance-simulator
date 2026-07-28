# Future Finance Simulator

> Learning Personal Finance Through Experience, Not Just Advice.

Future Finance Simulator is an interactive web-based platform that teaches budgeting, credit management, and financial decision-making through realistic life simulation — not lectures.

🔗 **Live:** [futurefinance.live](https://futurefinance.live)

> Alternate URL: [future-finance-simulator.onrender.com](https://future-finance-simulator-0tat.onrender.com)

---

## Overview

Future Finance Simulator bridges the gap between financial education and real-world experience. Users are assigned a random career, salary, and location, then navigate 12 simulated months of budgeting decisions, unexpected emergencies, and credit score consequences.

Built for high school students, community college students, and young adults who were never taught how money actually works.

---

## Features

- 💼 **Career Generator** — Get assigned a random job, salary, tax rate, and city to start your simulation
- 📊 **Monthly Budget Engine** — Allocate your income across housing, transport, food, utilities, and entertainment
- 📈 **Credit Score System** — Every financial decision affects your simulated credit score in real time
- ⚡ **Emergency Event Generator** — Random life events test your financial resilience (car breakdowns, medical bills, stolen phones, and more)
- 🏁 **Year-End Financial Report** — After 12 months, receive a full summary of your savings, spending, and credit journey
- 📱 **Fully Responsive** — Designed for both desktop and mobile

---

## Functionality

- 🎲 **Simulation Start** — Random career assignment with realistic after-tax monthly income
- 💰 **Live Budget Tracker** — Real-time remaining balance and category breakdown as you allocate funds
- 🔴 **Overspending Alerts** — Visual warnings when spending exceeds income, with credit score impact
- 📉 **Running Savings Balance** — Savings carry forward month to month, reflecting real financial momentum
- 🌩️ **40% Event Probability** — Each month has a 40% chance of triggering an emergency that drains savings
- 🧾 **Detailed Credit Reasoning** — Each month shows exactly why your score went up or down

---

## Tech Stack

| Layer           | Tools                               |
| --------------- | ----------------------------------- |
| Frontend        | React, Vite, React Router           |
| Backend         | FastAPI, PostgreSQL                 |
| Styling         | Custom CSS with CSS Variables       |
| Deployment      | Render (full-stack, single service) |
| Version Control | Git, GitHub                         |

---

## Project Background

Most students spend years preparing for a career without ever thinking about what happens after the first paycheck arrives. Future Finance Simulator was built to fill that gap — giving students a chance to experience the financial reality of their future job before they ever set foot in it.
Pick a career, get your salary, and figure out how to make rent, cover groceries, handle a car breakdown, and still have something left over. It's the part of "adulting" nobody teaches you in school — and the part that catches most people completely off guard.

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Create a `.env` file in `/backend` with:

```
DATABASE_URL=your_postgresql_connection_string
```

---

© 2026 Future Finance Simulator — Learning Personal Finance Through Experience
