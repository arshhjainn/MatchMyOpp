"""Daily Render Cron worker for opt-in application deadline email reminders."""

import os
from datetime import date, datetime, timezone

from sqlalchemy.exc import IntegrityError

from application_logic import due_reminder_windows, parse_reminder_windows
from database import SessionLocal
from email_delivery import send_deadline_email, smtp_settings
from models import Application, Opportunity, ReminderDelivery, Student


def run_reminder_job(today=None, deliver=send_deadline_email):
    today = today or datetime.now(timezone.utc).date()
    windows = parse_reminder_windows(os.getenv("REMINDER_WINDOWS_DAYS", "7,3,1"))
    # Validate provider settings before reserving delivery records.
    smtp_settings()
    sent = skipped = failed = 0
    db = SessionLocal()
    try:
        rows = (
            db.query(Application, Opportunity, Student)
            .join(Opportunity, Application.opportunity_id == Opportunity.id)
            .join(Student, Application.student_id == Student.student_id)
            .filter(Student.email_reminders_enabled.is_(True))
            .filter(Student.email.isnot(None))
            .filter(Application.status.in_(["Interested", "Preparing"]))
            .filter(Opportunity.deadline >= today)
            .all()
        )

        for application, opportunity, student in rows:
            due_windows = due_reminder_windows(
                deadline=opportunity.deadline,
                today=today,
                status=application.status,
                reminder_windows=windows,
                email=student.email,
                opted_in=student.email_reminders_enabled,
            )
            if not due_windows:
                continue
            days_remaining = due_windows[0]

            delivery = (
                db.query(ReminderDelivery)
                .filter(
                    ReminderDelivery.application_id == application.id,
                    ReminderDelivery.reminder_window_days == days_remaining,
                    ReminderDelivery.deadline == opportunity.deadline,
                )
                .first()
            )
            if delivery and delivery.status in {"sent", "pending"}:
                skipped += 1
                continue

            now = datetime.now(timezone.utc).replace(tzinfo=None)
            if delivery:
                delivery.status = "pending"
                delivery.attempted_at = now
            else:
                delivery = ReminderDelivery(
                    application_id=application.id,
                    reminder_window_days=days_remaining,
                    deadline=opportunity.deadline,
                    status="pending",
                    attempted_at=now,
                )
                db.add(delivery)
            try:
                # Persist the unique claim before calling SMTP so repeated or
                # overlapping cron runs do not send the same reminder twice.
                db.commit()
            except IntegrityError:
                db.rollback()
                skipped += 1
                continue

            try:
                deliver(
                    recipient=student.email,
                    student_name=student.name,
                    opportunity_title=opportunity.title,
                    deadline=opportunity.deadline,
                    days_remaining=days_remaining,
                    application_url=opportunity.application_url,
                )
                delivery.status = "sent"
                delivery.sent_at = datetime.now(timezone.utc).replace(tzinfo=None)
                db.commit()
                sent += 1
            except Exception:
                db.rollback()
                # A failed SMTP attempt can be safely retried by the next run.
                failed += 1
                db.query(ReminderDelivery).filter(
                    ReminderDelivery.application_id == application.id,
                    ReminderDelivery.reminder_window_days == days_remaining,
                    ReminderDelivery.deadline == opportunity.deadline,
                ).update({ReminderDelivery.status: "failed"}, synchronize_session=False)
                db.commit()

        print(f"Deadline reminder run complete: sent={sent} skipped={skipped} failed={failed}")
        if failed:
            raise RuntimeError(f"{failed} deadline reminder email(s) failed")
        return {"sent": sent, "skipped": skipped, "failed": failed}
    finally:
        db.close()


if __name__ == "__main__":
    run_reminder_job()

