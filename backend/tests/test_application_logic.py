import unittest
from datetime import date, timedelta
from types import SimpleNamespace

from application_logic import (
    deadline_entry,
    is_valid_application_status,
    parse_reminder_windows,
)


def application(status="Interested"):
    return SimpleNamespace(
        id=4,
        student_id="student-test",
        opportunity_id=12,
        status=status,
        notes=None,
        created_at=None,
        updated_at=None,
        submitted_at=None,
    )


def opportunity(deadline):
    return SimpleNamespace(
        id=12,
        title="Test opportunity",
        category="STEM",
        deadline=deadline,
        application_url="https://example.test/apply",
    )


class ApplicationLogicTests(unittest.TestCase):
    def test_statuses_accept_current_set_and_keep_legacy_values(self):
        self.assertTrue(is_valid_application_status("Interested"))
        self.assertTrue(is_valid_application_status("Accepted", current="Accepted"))
        self.assertFalse(is_valid_application_status("Unknown"))

    def test_reminder_windows_are_validated_sorted_and_deduplicated(self):
        self.assertEqual(parse_reminder_windows("3,7,3,1"), [7, 3, 1])
        with self.assertRaises(ValueError):
            parse_reminder_windows("7,abc")
        with self.assertRaises(ValueError):
            parse_reminder_windows("0,31")

    def test_deadline_groups_and_exact_reminder_windows(self):
        today = date(2026, 10, 10)
        scenarios = [
            (today, "due_today", []),
            (today + timedelta(days=1), "due_within_3_days", [1]),
            (today + timedelta(days=3), "due_within_3_days", [3]),
            (today + timedelta(days=5), "due_within_7_days", []),
            (today + timedelta(days=12), "upcoming_later", []),
            (today - timedelta(days=1), "overdue", []),
        ]
        for deadline, expected_group, expected_windows in scenarios:
            with self.subTest(deadline=deadline):
                entry = deadline_entry(application(), opportunity(deadline), today, [7, 3, 1])
                self.assertEqual(entry["deadline_group"], expected_group)
                self.assertEqual(entry["reminder_windows_due"], expected_windows)

    def test_missing_deadline_is_unknown_and_not_a_reminder(self):
        entry = deadline_entry(application(), None, date(2026, 10, 10), [7, 3, 1])
        self.assertEqual(entry["deadline_group"], "deadline_unknown")
        self.assertIsNone(entry["days_remaining"])
        self.assertEqual(entry["reminder_windows_due"], [])

    def test_submitted_or_terminal_applications_do_not_receive_deadline_reminders(self):
        deadline = date(2026, 10, 11)
        for status in ("Applied", "Shortlisted", "Selected", "Rejected", "Withdrawn", "Accepted"):
            with self.subTest(status=status):
                entry = deadline_entry(application(status), opportunity(deadline), date(2026, 10, 10), [1])
                self.assertFalse(entry["actionable"])
                self.assertEqual(entry["reminder_windows_due"], [])


if __name__ == "__main__":
    unittest.main()
