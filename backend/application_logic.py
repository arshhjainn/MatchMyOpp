from datetime import date


APPLICATION_STATUSES = {
    "Interested", "Preparing", "Applied", "Shortlisted", "Interview",
    "Selected", "Rejected", "Withdrawn",
}
LEGACY_APPLICATION_STATUSES = {"Accepted"}
TERMINAL_APPLICATION_STATUSES = {
    "applied", "shortlisted", "interview", "selected", "rejected", "withdrawn", "accepted",
}
SUBMITTED_APPLICATION_STATUSES = {
    "applied", "shortlisted", "interview", "selected", "rejected", "accepted",
}


def is_valid_application_status(status, current=None):
    if status is None:
        return True
    return status in APPLICATION_STATUSES | LEGACY_APPLICATION_STATUSES or status == current


def parse_reminder_windows(value):
    try:
        windows = [int(item.strip()) for item in value.split(",") if item.strip()]
    except ValueError as exc:
        raise ValueError("reminder_windows must be comma-separated day counts") from exc
    if not windows or any(window < 1 or window > 30 for window in windows):
        raise ValueError("Reminder windows must contain day counts from 1 to 30")
    return sorted(set(windows), reverse=True)


def due_reminder_windows(*, deadline, today, status, reminder_windows, email, opted_in):
    """Return due reminder windows only for opted-in, still-actionable applications."""
    if not opted_in or not email or not deadline or (status or "").lower() not in {"interested", "preparing"}:
        return []
    days_remaining = (deadline - today).days
    if days_remaining < 0 or days_remaining not in reminder_windows:
        return []
    return [days_remaining]


def application_payload(application, opportunity=None):
    return {
        "id": application.id,
        "application_id": application.id,
        "student_id": application.student_id,
        "opportunity_id": application.opportunity_id,
        "title": opportunity.title if opportunity else "Unknown",
        "category": opportunity.category if opportunity else None,
        "status": application.status,
        "notes": application.notes,
        "deadline": opportunity.deadline if opportunity else None,
        "application_url": opportunity.application_url if opportunity else None,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
        "submitted_at": application.submitted_at,
    }


def deadline_entry(application, opportunity, today: date, reminder_windows):
    deadline = opportunity.deadline if opportunity else None
    days_remaining = (deadline - today).days if deadline else None
    status = application.status or "Interested"
    status_key = status.lower()
    expired = days_remaining is not None and days_remaining < 0
    group = (
        "deadline_unknown" if days_remaining is None else
        "overdue" if expired else
        "due_today" if days_remaining == 0 else
        "due_within_3_days" if days_remaining <= 3 else
        "due_within_7_days" if days_remaining <= 7 else
        "upcoming_later"
    )
    # The application deadline is actionable only before a student submits.
    actionable = status_key in {"interested", "preparing"} and days_remaining is not None and not expired
    matching_windows = [window for window in reminder_windows if days_remaining == window] if actionable else []
    return {
        **application_payload(application, opportunity),
        "deadline_group": group,
        "days_remaining": days_remaining,
        "actionable": actionable,
        "reminder_windows_due": matching_windows,
    }
