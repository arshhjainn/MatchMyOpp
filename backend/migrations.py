"""Small, additive migrations for the existing production schema.

`Base.metadata.create_all()` creates missing tables but does not add columns to
tables that already exist. These nullable additions preserve every current
application row and are safe to retry on subsequent service starts.
"""

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError


APPLICATION_COLUMNS = {
    "created_at": "DATETIME NULL",
    "updated_at": "DATETIME NULL",
    "submitted_at": "DATE NULL",
}
STUDENT_COLUMNS = {
    "email": "VARCHAR(254) NULL",
    "email_reminders_enabled": "BOOLEAN NOT NULL DEFAULT 0",
}


def migrate_application_columns(database_engine):
    for table_name, columns in (
        ("applications", APPLICATION_COLUMNS),
        ("students", STUDENT_COLUMNS),
    ):
        inspector = inspect(database_engine)
        if not inspector.has_table(table_name):
            continue

        existing = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, sql_type in columns.items():
            if column_name in existing:
                continue

            try:
                with database_engine.begin() as connection:
                    # Names and types come only from constants in this module.
                    connection.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {sql_type}"
                    ))
            except SQLAlchemyError:
                # Concurrent service starts may race on an additive migration.
                refreshed = inspect(database_engine)
                current = {column["name"] for column in refreshed.get_columns(table_name)}
                if column_name not in current:
                    raise
            existing.add(column_name)
