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
APPLICATION_UNIQUE_CONSTRAINT = "uq_student_opportunity_application"


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

    # Preserve legacy rows. A unique constraint can only be added when the
    # existing data has no duplicate student/opportunity pairs, so leave it
    # unapplied if duplicates already exist rather than deleting user data or
    # making application startup fail.
    if _has_application_pair_uniqueness(database_engine):
        return

    with database_engine.connect() as connection:
        duplicate = connection.execute(text(
            "SELECT 1 FROM applications "
            "GROUP BY student_id, opportunity_id HAVING COUNT(*) > 1 LIMIT 1"
        )).first()
    if duplicate:
        return

    try:
        with database_engine.begin() as connection:
            connection.execute(text(
                "ALTER TABLE applications ADD CONSTRAINT "
                f"{APPLICATION_UNIQUE_CONSTRAINT} UNIQUE (student_id, opportunity_id)"
            ))
    except SQLAlchemyError:
        # Concurrent service starts can both observe the missing constraint.
        if not _has_application_pair_uniqueness(database_engine):
            raise


def _has_application_pair_uniqueness(database_engine):
    inspector = inspect(database_engine)
    columns = {"student_id", "opportunity_id"}
    unique_constraints = inspector.get_unique_constraints("applications")
    unique_indexes = [index for index in inspector.get_indexes("applications") if index.get("unique")]
    return any(
        set(item.get("column_names") or []) == columns
        for item in unique_constraints + unique_indexes
    )
