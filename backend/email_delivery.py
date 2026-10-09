"""SMTP delivery helpers for scheduled deadline reminder emails."""

import os
import smtplib
from email.message import EmailMessage


def smtp_settings():
    required = ("SMTP_HOST", "SMTP_FROM_EMAIL")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError("Missing email configuration: " + ", ".join(missing))

    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    if bool(username) != bool(password):
        raise RuntimeError("Set both SMTP_USERNAME and SMTP_PASSWORD, or leave both empty")

    return {
        "host": os.environ["SMTP_HOST"],
        "port": int(os.getenv("SMTP_PORT", "587")),
        "username": username,
        "password": password,
        "from_email": os.environ["SMTP_FROM_EMAIL"],
        "starttls": os.getenv("SMTP_USE_STARTTLS", "true").lower() in {"1", "true", "yes"},
    }


def build_deadline_email(*, recipient, student_name, opportunity_title, deadline, days_remaining, application_url):
    message = EmailMessage()
    message["To"] = recipient
    message["Subject"] = f"Deadline reminder: {opportunity_title}"
    message.set_content(
        f"Hi {student_name or 'there'},\n\n"
        f"The deadline for {opportunity_title} is {deadline.isoformat()} "
        f"({'today' if days_remaining == 0 else f'in {days_remaining} day(s)'}).\n\n"
        f"Review your application: {application_url}\n\n"
        "You are receiving this because email deadline reminders are enabled in your MatchMyOpp profile."
    )
    return message


def send_deadline_email(*, recipient, student_name, opportunity_title, deadline, days_remaining, application_url):
    settings = smtp_settings()
    message = build_deadline_email(
        recipient=recipient,
        student_name=student_name,
        opportunity_title=opportunity_title,
        deadline=deadline,
        days_remaining=days_remaining,
        application_url=application_url,
    )
    message["From"] = settings["from_email"]

    with smtplib.SMTP(settings["host"], settings["port"], timeout=25) as smtp:
        smtp.ehlo()
        if settings["starttls"]:
            smtp.starttls()
            smtp.ehlo()
        if settings["username"]:
            smtp.login(settings["username"], settings["password"])
        refused = smtp.send_message(message)
        if recipient in refused:
            raise RuntimeError("SMTP provider refused the recipient")

