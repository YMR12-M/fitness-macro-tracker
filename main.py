"""
FitTrack Pro - Python FastAPI Backend
======================================
REST API for the Fitness & Macro Tracker application.

Requirements:
    pip install fastapi uvicorn sqlalchemy pydantic python-dotenv

Run:
    uvicorn main:app --reload --port 8000

Docs:
    http://localhost:8000/docs  (Swagger UI auto-generated)
"""

from __future__ import annotations

import os
from datetime import date, datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    Date, Boolean, DateTime, Text, func
)
from sqlalchemy.orm import declarative_base, Session, sessionmaker

# ─────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fittrack.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(
    title="FitTrack Pro API",
    description="Fitness & Macro Tracker - Python FastAPI Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory=".", html=True), name="static")

# ─────────────────────────────────────────────────
# MODELS (SQLAlchemy ORM)
# ─────────────────────────────────────────────────
class UserModel(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, nullable=False)
    age           = Column(Integer)
    height_cm     = Column(Float)
    weight_kg     = Column(Float)
    goal_type     = Column(String(20), default="maintain")
    calorie_goal  = Column(Integer, default=2000)
    created_at    = Column(DateTime, default=datetime.utcnow)


class MealModel(Base):
    __tablename__ = "meals"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    name       = Column(String(150), nullable=False)
    emoji      = Column(String(10), default="🍽️")
    meal_type  = Column(String(20), default="lunch")
    calories   = Column(Integer, nullable=False)
    protein    = Column(Float, default=0)
    carbs      = Column(Float, default=0)
    fat        = Column(Float, default=0)
    date       = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkoutModel(Base):
    __tablename__ = "workouts"
    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, nullable=False, index=True)
    workout_type     = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, default=0)
    calories_burned  = Column(Integer, default=0)
    intensity        = Column(String(20), default="moderate")
    notes            = Column(Text, default="")
    date             = Column(Date, nullable=False)


class WeightLogModel(Base):
    __tablename__ = "weight_log"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    weight_kg  = Column(Float, nullable=False)
    body_fat   = Column(Float)
    notes      = Column(String(300), default="")
    date       = Column(Date, nullable=False)
    logged_at  = Column(DateTime, default=datetime.utcnow)


class GoalModel(Base):
    __tablename__ = "goals"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, nullable=False, index=True)
    name          = Column(String(150), nullable=False)
    icon          = Column(String(10), default="🎯")
    current_value = Column(Float, default=0)
    target_value  = Column(Float, nullable=False)
    unit          = Column(String(30), default="")
    deadline      = Column(Date, nullable=False)
    completed     = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────────
class MealCreate(BaseModel):
    user_id:   int
    name:      str = Field(..., min_length=1, max_length=150)
    emoji:     str = "🍽️"
    meal_type: str = "lunch"
    calories:  int = Field(..., ge=0)
    protein:   float = 0.0
    carbs:     float = 0.0
    fat:       float = 0.0
    date:      date  = Field(default_factory=date.today)


class MealOut(MealCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class WorkoutCreate(BaseModel):
    user_id:          int
    workout_type:     str
    duration_minutes: int  = Field(..., ge=1)
    calories_burned:  int  = Field(0, ge=0)
    intensity:        str  = "moderate"
    notes:            str  = ""
    date:             date = Field(default_factory=date.today)


class WorkoutOut(WorkoutCreate):
    id: int
    class Config:
        from_attributes = True


class WeightCreate(BaseModel):
    user_id:   int
    weight_kg: float = Field(..., ge=10, le=500)
    body_fat:  Optional[float] = None
    notes:     str  = ""
    date:      date = Field(default_factory=date.today)


class WeightOut(WeightCreate):
    id: int
    logged_at: datetime
    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    user_id:       int
    name:          str
    icon:          str   = "🎯"
    current_value: float = 0.0
    target_value:  float
    unit:          str   = ""
    deadline:      date


class GoalOut(GoalCreate):
    id: int
    completed: bool
    created_at: datetime
    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    date:     date
    calories: dict
    macros:   dict
    workout:  dict


# ─────────────────────────────────────────────────
# DB DEPENDENCY
# ─────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────────
# ROUTES: MEALS
# ─────────────────────────────────────────────────
@app.get("/meals", response_model=List[MealOut], tags=["Meals"])
def list_meals(
    user_id: int = Query(...),
    log_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
):
    """Get all meals for a user on a specific date."""
    return db.query(MealModel).filter(
        MealModel.user_id == user_id,
        MealModel.date == log_date,
    ).order_by(MealModel.created_at.desc()).all()


@app.post("/meals", response_model=MealOut, status_code=201, tags=["Meals"])
def create_meal(payload: MealCreate, db: Session = Depends(get_db)):
    """Log a new meal."""
    meal = MealModel(**payload.model_dump())
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@app.delete("/meals/{meal_id}", tags=["Meals"])
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    """Delete a logged meal."""
    meal = db.query(MealModel).filter(MealModel.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted successfully"}


# ─────────────────────────────────────────────────
# ROUTES: WORKOUTS
# ─────────────────────────────────────────────────
@app.get("/workouts", response_model=List[WorkoutOut], tags=["Workouts"])
def list_workouts(user_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(WorkoutModel).filter(
        WorkoutModel.user_id == user_id
    ).order_by(WorkoutModel.date.desc()).limit(30).all()


@app.post("/workouts", response_model=WorkoutOut, status_code=201, tags=["Workouts"])
def create_workout(payload: WorkoutCreate, db: Session = Depends(get_db)):
    workout = WorkoutModel(**payload.model_dump())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


@app.delete("/workouts/{workout_id}", tags=["Workouts"])
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    w = db.query(WorkoutModel).filter(WorkoutModel.id == workout_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workout not found")
    db.delete(w)
    db.commit()
    return {"message": "Workout deleted successfully"}


# ─────────────────────────────────────────────────
# ROUTES: WEIGHT
# ─────────────────────────────────────────────────
@app.get("/weight", response_model=List[WeightOut], tags=["Weight"])
def list_weight(user_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(WeightLogModel).filter(
        WeightLogModel.user_id == user_id
    ).order_by(WeightLogModel.date.asc()).limit(60).all()


@app.post("/weight", response_model=WeightOut, status_code=201, tags=["Weight"])
def log_weight(payload: WeightCreate, db: Session = Depends(get_db)):
    entry = WeightLogModel(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# ─────────────────────────────────────────────────
# ROUTES: GOALS
# ─────────────────────────────────────────────────
@app.get("/goals", response_model=List[GoalOut], tags=["Goals"])
def list_goals(user_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(GoalModel).filter(
        GoalModel.user_id == user_id
    ).order_by(GoalModel.deadline.asc()).all()


@app.post("/goals", response_model=GoalOut, status_code=201, tags=["Goals"])
def create_goal(payload: GoalCreate, db: Session = Depends(get_db)):
    goal = GoalModel(**payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@app.patch("/goals/{goal_id}", response_model=GoalOut, tags=["Goals"])
def update_goal_progress(goal_id: int, current_value: float, db: Session = Depends(get_db)):
    goal = db.query(GoalModel).filter(GoalModel.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.current_value = current_value
    goal.completed = (current_value >= goal.target_value)
    db.commit()
    db.refresh(goal)
    return goal


@app.delete("/goals/{goal_id}", tags=["Goals"])
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(GoalModel).filter(GoalModel.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}


# ─────────────────────────────────────────────────
# ROUTES: DAILY SUMMARY
# ─────────────────────────────────────────────────
@app.get("/summary", response_model=SummaryOut, tags=["Summary"])
def daily_summary(
    user_id:  int  = Query(...),
    log_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
):
    """Return aggregated nutrition + workout totals for a given day."""
    macros = db.query(
        func.coalesce(func.sum(MealModel.calories), 0).label("cal"),
        func.coalesce(func.sum(MealModel.protein),  0).label("protein"),
        func.coalesce(func.sum(MealModel.carbs),    0).label("carbs"),
        func.coalesce(func.sum(MealModel.fat),      0).label("fat"),
    ).filter(MealModel.user_id == user_id, MealModel.date == log_date).one()

    workout = db.query(
        func.coalesce(func.sum(WorkoutModel.calories_burned),  0).label("burned"),
        func.coalesce(func.sum(WorkoutModel.duration_minutes), 0).label("minutes"),
    ).filter(WorkoutModel.user_id == user_id, WorkoutModel.date == log_date).one()

    return SummaryOut(
        date=log_date,
        calories={
            "eaten":  int(macros.cal),
            "burned": int(workout.burned),
            "net":    int(macros.cal - workout.burned),
            "goal":   2000,
        },
        macros={
            "protein": round(float(macros.protein), 1),
            "carbs":   round(float(macros.carbs),   1),
            "fat":     round(float(macros.fat),      1),
        },
        workout={
            "minutes": int(workout.minutes),
        },
    )


# ─────────────────────────────────────────────────
# CALORIE CALCULATOR UTILITY
# ─────────────────────────────────────────────────
@app.get("/calc/tdee", tags=["Utilities"])
def calculate_tdee(
    weight_kg: float = Query(..., description="Weight in kilograms"),
    height_cm: float = Query(..., description="Height in centimeters"),
    age:        int  = Query(..., description="Age"),
    gender:     str  = Query("male", description="male / female"),
    activity:   str  = Query("moderate", description="sedentary / light / moderate / active / very_active"),
    goal:       str  = Query("maintain", description="cut / maintain / bulk"),
):
    """Calculate Total Daily Energy Expenditure (TDEE) using Mifflin-St Jeor."""
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    multipliers = {
        "sedentary":   1.2,
        "light":       1.375,
        "moderate":    1.55,
        "active":      1.725,
        "very_active": 1.9,
    }
    tdee = bmr * multipliers.get(activity, 1.55)

    adjustments = {"cut": -500, "maintain": 0, "bulk": +300}
    target_calories = tdee + adjustments.get(goal, 0)

    return {
        "bmr":             round(bmr),
        "tdee":            round(tdee),
        "target_calories": round(target_calories),
        "macros": {
            "protein_g": round(weight_kg * 2.2),
            "fat_g":     round(target_calories * 0.25 / 9),
            "carbs_g":   round((target_calories - weight_kg * 2.2 * 4 - target_calories * 0.25) / 4),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
