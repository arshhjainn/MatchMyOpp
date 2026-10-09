from datetime import date
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Student, Opportunity, Swipe, Application

app = FastAPI(title="Opportunity Radar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://matchmyopp.vercel.app/",
        "http://localhost:5173",
        "http://127.0.0.1:5173"  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


class ProfileInput(BaseModel):
    student_id: str
    name: str
    age: Optional[int] = None
    grade: str
    location: str
    skills: list[str] = []
    interests: list[str] = []


class OpportunityInput(BaseModel):
    title: str
    category: str
    description: str
    skills: list[str] = []
    eligible_grades: list[str] = []
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    location: str = "Online"
    deadline: date
    reward: Optional[str] = None
    application_url: str


class SwipeInput(BaseModel):
    student_id: str
    opportunity_id: int
    action: str


class ApplicationInput(BaseModel):
    student_id: str
    opportunity_id: int
    status: str = "Interested"
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@app.get("/")
def home():
    return {"message": "Welcome to Opportunity Radar API"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.post("/api/profile")
def save_profile(data: ProfileInput, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()

    if student is None:
        student = Student(student_id=data.student_id)
        db.add(student)

    student.name = data.name
    student.age = data.age
    student.grade = data.grade
    student.location = data.location
    student.skills = data.skills
    student.interests = data.interests

    db.commit()
    db.refresh(student)

    return {"message": "Profile saved successfully", "student_id": student.student_id}


@app.get("/api/profile/{student_id}")
def get_profile(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "student_id": student.student_id,
        "name": student.name,
        "age": student.age,
        "grade": student.grade,
        "location": student.location,
        "skills": student.skills,
        "interests": student.interests,
    }


@app.post("/api/opportunities")
def create_opportunity(
    data: OpportunityInput,
    db: Session = Depends(get_db)
):
    opportunity = Opportunity(**data.model_dump())
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    return {
        "message": "Opportunity created successfully",
        "id": opportunity.id,
    }


@app.get("/api/opportunities")
def get_opportunities(
    student_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    opportunities = db.query(Opportunity).filter(
        Opportunity.deadline >= date.today()
    ).all()

    student = None
    swiped_ids = set()

    if student_id:
        student = db.query(Student).filter(
            Student.student_id == student_id
        ).first()

        if student:
            swipes = db.query(Swipe).filter(
                Swipe.student_id == student_id
            ).all()
            swiped_ids = {swipe.opportunity_id for swipe in swipes}

    results = []

    for opportunity in opportunities:
        if opportunity.id in swiped_ids:
            continue

        score = 0
        reasons = []

        if student:
            student_skills = {
                s.lower() for s in (student.skills or [])
            }
            student_interests = {
                s.lower() for s in (student.interests or [])
            }
            opportunity_skills = {
                s.lower() for s in (opportunity.skills or [])
            }

            matched_skills = student_skills & opportunity_skills

            if opportunity_skills:
                score += round(
                    60 * len(matched_skills) / len(opportunity_skills)
                )

            if matched_skills:
                reasons.append(
                    "Matching skills: " + ", ".join(sorted(matched_skills))
                )

            if opportunity.category.lower() in student_interests:
                score += 25
                reasons.append("Matches your interests")

            eligible_grades = [
                g.lower() for g in (opportunity.eligible_grades or [])
            ]

            if eligible_grades and student.grade.lower() not in eligible_grades:
                continue

            if opportunity.min_age is not None:
                if student.age is None or student.age < opportunity.min_age:
                    continue

            if opportunity.max_age is not None:
                if student.age is None or student.age > opportunity.max_age:
                    continue

            if (
                opportunity.location.lower() != "online"
                and opportunity.location.lower() != "anywhere"
                and student.location.lower() != opportunity.location.lower()
            ):
                continue

        results.append({
            "id": opportunity.id,
            "title": opportunity.title,
            "category": opportunity.category,
            "description": opportunity.description,
            "skills": opportunity.skills,
            "eligible_grades": opportunity.eligible_grades,
            "min_age": opportunity.min_age,
            "max_age": opportunity.max_age,
            "location": opportunity.location,
            "deadline": opportunity.deadline,
            "reward": opportunity.reward,
            "application_url": opportunity.application_url,
            "match_score": score,
            "match_reasons": reasons,
        })

    results.sort(key=lambda item: item["match_score"], reverse=True)
    return results


@app.get("/api/opportunities/{opportunity_id}")
def get_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db)
):
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
        "id": opportunity.id,
        "title": opportunity.title,
        "category": opportunity.category,
        "description": opportunity.description,
        "skills": opportunity.skills,
        "eligible_grades": opportunity.eligible_grades,
        "min_age": opportunity.min_age,
        "max_age": opportunity.max_age,
        "location": opportunity.location,
        "deadline": opportunity.deadline,
        "reward": opportunity.reward,
        "application_url": opportunity.application_url,
    }


@app.post("/api/swipes")
def save_swipe(data: SwipeInput, db: Session = Depends(get_db)):
    if data.action not in ["like", "pass"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be 'like' or 'pass'"
        )

    student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()

    opportunity = db.query(Opportunity).filter(
        Opportunity.id == data.opportunity_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    swipe = db.query(Swipe).filter(
        Swipe.student_id == data.student_id,
        Swipe.opportunity_id == data.opportunity_id
    ).first()

    if swipe:
        swipe.action = data.action
    else:
        swipe = Swipe(
            student_id=data.student_id,
            opportunity_id=data.opportunity_id,
            action=data.action
        )
        db.add(swipe)

    db.commit()

    return {"message": "Swipe saved", "action": data.action}


@app.get("/api/saved/{student_id}")
def get_saved(student_id: str, db: Session = Depends(get_db)):
    swipes = db.query(Swipe).filter(
        Swipe.student_id == student_id,
        Swipe.action == "like"
    ).all()

    saved = []

    for swipe in swipes:
        opportunity = db.query(Opportunity).filter(
            Opportunity.id == swipe.opportunity_id
        ).first()

        if opportunity:
            saved.append({
                "id": opportunity.id,
                "title": opportunity.title,
                "category": opportunity.category,
                "description": opportunity.description,
                "deadline": opportunity.deadline,
                "reward": opportunity.reward,
                "application_url": opportunity.application_url,
            })

    return saved


@app.post("/api/applications")
def create_application(
    data: ApplicationInput,
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(
        Student.student_id == data.student_id
    ).first()

    opportunity = db.query(Opportunity).filter(
        Opportunity.id == data.opportunity_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    existing = db.query(Application).filter(
        Application.student_id == data.student_id,
        Application.opportunity_id == data.opportunity_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Application tracker entry already exists"
        )

    application = Application(**data.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Application added",
        "application_id": application.id,
    }


@app.get("/api/applications/{student_id}")
def get_applications(student_id: str, db: Session = Depends(get_db)):
    applications = db.query(Application).filter(
        Application.student_id == student_id
    ).all()

    results = []

    for application in applications:
        opportunity = db.query(Opportunity).filter(
            Opportunity.id == application.opportunity_id
        ).first()

        results.append({
            "id": application.id,
            "opportunity_id": application.opportunity_id,
            "title": opportunity.title if opportunity else "Unknown",
            "status": application.status,
            "notes": application.notes,
        })

    return results


@app.patch("/api/applications/{application_id}")
def update_application(
    application_id: int,
    data: ApplicationUpdate,
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    updates = data.model_dump(exclude_unset=True)

    for key, value in updates.items():
        setattr(application, key, value)

    db.commit()
    db.refresh(application)

    return {"message": "Application updated successfully"}
