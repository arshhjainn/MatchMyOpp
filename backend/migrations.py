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


def migrate_application_columns(database_engine):
    inspector = inspect(database_engine)
    if not inspector.has_table("applications"):
        return

    existing = {column["name"] for column in inspector.get_columns("applications")}
    for column_name, sql_type in APPLICATION_COLUMNS.items():
        if column_name in existing:
            continue

        try:
            with database_engine.begin() as connection:
                # Column names and types come only from this module's constants.
                connection.execute(text(
                    f"ALTER TABLE applications ADD COLUMN {column_name} {sql_type}"
                ))
        except SQLAlchemyError:
            # If multiple app processes race on the same startup migration,
            # ignore the duplicate-column error only when the column now exists.
            refreshed = inspect(database_engine)
            if column_name not in {column["name"] for column in refreshed.get_columns("applications")}:
                raise
        existing.add(column_name)
