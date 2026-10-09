from sqlalchemy import (
    Column,
    Boolean,
    String,
    Integer,
    Text,
    Date,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import JSON

from database import Base


class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    grade = Column(String(30), nullable=False)
    location = Column(String(100), nullable=False)
    skills = Column(JSON, nullable=False)
    interests = Column(JSON, nullable=False)
    email = Column(String(254), nullable=True)
    email_reminders_enabled = Column(Boolean, nullable=False, default=False)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    skills = Column(JSON, nullable=False)
    eligible_grades = Column(JSON, nullable=False)
    min_age = Column(Integer, nullable=True)
    max_age = Column(Integer, nullable=True)
    location = Column(String(100), nullable=False)
    deadline = Column(Date, nullable=False)
    reward = Column(String(150), nullable=True)
    application_url = Column(String(500), nullable=False)


class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        String(50),
        ForeignKey("students.student_id"),
        nullable=False,
    )
    opportunity_id = Column(
        Integer,
        ForeignKey("opportunities.id"),
        nullable=False,
    )
    action = Column(String(10), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "opportunity_id",
            name="uq_student_opportunity_swipe",
        ),
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        String(50),
        ForeignKey("students.student_id"),
        nullable=False,
    )
    opportunity_id = Column(
        Integer,
        ForeignKey("opportunities.id"),
        nullable=False,
    )
    status = Column(String(30), nullable=False, default="Interested")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    submitted_at = Column(Date, nullable=True)


class ReminderDelivery(Base):
    __tablename__ = "reminder_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False,
    )
    reminder_window_days = Column(Integer, nullable=False)
    deadline = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    attempted_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "application_id",
            "reminder_window_days",
            "deadline",
            name="uq_reminder_application_window_deadline",
        ),
    )
