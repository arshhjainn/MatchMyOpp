from datetime import date, datetime, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import Base, engine, get_db
from models import Student, Opportunity, Swipe, Application
from application_logic import (
    APPLICATION_STATUSES,
    SUBMITTED_APPLICATION_STATUSES,
    application_payload,
    deadline_entry,
    is_valid_application_status,
    parse_reminder_windows,
)
from migrations import migrate_application_columns

app = FastAPI(title="Opportunity Radar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://matchmyopp.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173"  
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    migrate_application_columns(engine)


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
    student_id: str = Field(min_length=1, max_length=50)
    opportunity_id: int = Field(gt=0)
    status: str = Field(
        default="Interested",
        min_length=1,
        max_length=30,
        description="Interested, Preparing, Applied, Shortlisted, Interview, Selected, Rejected, or Withdrawn",
    )
    notes: Optional[str] = Field(default=None, max_length=10000)


class ApplicationUpdate(BaseModel):
    status: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=30,
        description="One of the supported application statuses; legacy Accepted values remain valid for existing records",
    )
    notes: Optional[str] = Field(default=None, max_length=10000)


def utc_now_naive():
    """Return UTC for MySQL DATETIME columns, which don't preserve tzinfo."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def validate_application_status(status: Optional[str], current: Optional[str] = None):
    if not is_valid_application_status(status, current):
        choices = ", ".join(sorted(APPLICATION_STATUSES))
        raise HTTPException(status_code=422, detail=f"Status must be one of: {choices}")


def get_student_application_entries(student_id: str, db: Session):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    rows = (
        db.query(Application, Opportunity)
        .outerjoin(Opportunity, Application.opportunity_id == Opportunity.id)
        .filter(Application.student_id == student_id)
        .order_by(Application.created_at.desc(), Application.id.desc())
        .all()
    )
    return [(application, opportunity) for application, opportunity in rows]


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


@app.post(
    "/api/applications",
    summary="Add an application to the tracker",
    description="Creates one tracker entry. Duplicate student/opportunity pairs return HTTP 409. New entries start as Interested by default.",
)
def create_application(
    data: ApplicationInput,
    db: Session = Depends(get_db)
):
    student_id = data.student_id.strip()
    if not student_id:
        raise HTTPException(status_code=422, detail="student_id cannot be blank")

    student = db.query(Student).filter(
        Student.student_id == student_id
    ).first()

    opportunity = db.query(Opportunity).filter(
        Opportunity.id == data.opportunity_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    validate_application_status(data.status)

    existing = db.query(Application).filter(
        Application.student_id == student_id,
        Application.opportunity_id == data.opportunity_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Application tracker entry already exists"
        )

    now = utc_now_naive()
    application = Application(
        student_id=student_id,
        opportunity_id=data.opportunity_id,
        status=data.status,
        notes=data.notes,
        created_at=now,
        updated_at=now,
        submitted_at=now.date() if data.status.lower() in SUBMITTED_APPLICATION_STATUSES else None,
    )
    db.add(application)
    try:
        db.commit()
        db.refresh(application)
    except IntegrityError:
        db.rollback()
        # The model's unique constraint is the final guard against two
        # simultaneous requests creating the same student/opportunity pair.
        duplicate = db.query(Application).filter(
            Application.student_id == student_id,
            Application.opportunity_id == data.opportunity_id,
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="Application tracker entry already exists")
        raise

    return {
        "message": "Application added",
        "application_id": application.id,
        **application_payload(application, opportunity),
    }


@app.get(
    "/api/applications/{student_id}",
    summary="List a student's tracked applications",
    description="Returns application fields plus the linked opportunity's title, category, actual deadline, and application URL.",
)
def get_applications(
    student_id: str = Path(min_length=1, max_length=50),
    db: Session = Depends(get_db),
):
    rows = get_student_application_entries(student_id, db)
    return [application_payload(application, opportunity) for application, opportunity in rows]


@app.get(
    "/api/application/{application_id}",
    summary="Get one tracked application",
    description="Uses a singular route to avoid ambiguity with the existing student application list route.",
)
def get_application(
    application_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Application, Opportunity)
        .outerjoin(Opportunity, Application.opportunity_id == Opportunity.id)
        .filter(Application.id == application_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Application not found")
    application, opportunity = row
    return application_payload(application, opportunity)


@app.patch(
    "/api/applications/{application_id}",
    summary="Update application status or notes",
    description="Updates only supplied fields. Moving status to Applied records submitted_at once and does not overwrite it later.",
)
def update_application(
    data: ApplicationUpdate,
    application_id: int = Path(gt=0),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=422, detail="Provide a status or notes value to update")
    if "status" in updates:
        validate_application_status(updates["status"], current=application.status)
        if updates["status"] is None:
            raise HTTPException(status_code=422, detail="status cannot be null")

    for key, value in updates.items():
        setattr(application, key, value)

    if (updates.get("status") or "").lower() in SUBMITTED_APPLICATION_STATUSES and application.submitted_at is None:
        application.submitted_at = utc_now_naive().date()
    application.updated_at = utc_now_naive()

    db.commit()
    db.refresh(application)

    opportunity = db.query(Opportunity).filter(Opportunity.id == application.opportunity_id).first()
    return {
        "message": "Application updated successfully",
        **application_payload(application, opportunity),
    }


@app.get(
    "/api/deadlines/{student_id}",
    summary="List tracked deadlines and in-app reminder candidates",
    description="Groups actual opportunity deadlines and returns reminder windows due today. This endpoint does not send email or push notifications.",
)
def get_deadlines(
    student_id: str = Path(min_length=1, max_length=50),
    reminder_windows: str = Query(default="7,3,1", description="Comma-separated reminder windows in days, from 1 to 30"),
    db: Session = Depends(get_db),
):
    try:
        windows = parse_reminder_windows(reminder_windows)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    rows = get_student_application_entries(student_id, db)
    today = datetime.now(timezone.utc).date()
    groups = {
        "due_today": [],
        "due_within_3_days": [],
        "due_within_7_days": [],
        "upcoming_later": [],
        "overdue": [],
        "deadline_unknown": [],
    }
    reminder_candidates = []

    for application, opportunity in rows:
        entry = deadline_entry(application, opportunity, today, windows)
        groups[entry["deadline_group"]].append(entry)
        if entry["reminder_windows_due"]:
            reminder_candidates.append(entry)

    return {
        "student_id": student_id,
        "as_of": today,
        "reminder_windows_days": windows,
        "groups": groups,
        "reminder_candidates": reminder_candidates,
        "delivery": "in_app_only",
    }


@app.get(
    "/api/dashboard/{student_id}",
    summary="Get application tracker dashboard statistics",
    description="Returns aggregate tracker and deadline counts for a student.",
)
def get_application_dashboard(
    student_id: str = Path(min_length=1, max_length=50),
    db: Session = Depends(get_db),
):
    rows = get_student_application_entries(student_id, db)
    today = datetime.now(timezone.utc).date()
    entries = [deadline_entry(application, opportunity, today, [7, 3, 1]) for application, opportunity in rows]
    statuses = [(entry["status"] or "Interested").lower() for entry in entries]
    upcoming = sum(
        1 for entry in entries
        if entry["actionable"] and entry["days_remaining"] is not None and 0 <= entry["days_remaining"] <= 7
    )
    return {
        "student_id": student_id,
        "total_tracked": len(entries),
        "applications_submitted": sum(status in SUBMITTED_APPLICATION_STATUSES for status in statuses),
        "shortlisted": sum(status == "shortlisted" for status in statuses),
        "upcoming_deadlines": upcoming,
        "overdue_deadlines": sum(entry["deadline_group"] == "overdue" for entry in entries),
        "deadlines_unknown": sum(entry["deadline_group"] == "deadline_unknown" for entry in entries),
    }
