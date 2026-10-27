import json
import os
import sqlite3
from pathlib import Path
from typing import Any


DB_PATH = Path(
    os.getenv(
        "SKILLBRIDGE_DB_PATH",
        str(Path(__file__).resolve().parents[1] / "skillbridge.db"),
    )
)


def _connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT NOT NULL DEFAULT '',
            target_role TEXT NOT NULL DEFAULT 'Python Developer',
            experience_level TEXT NOT NULL DEFAULT 'exploring',
            daily_minutes INTEGER NOT NULL DEFAULT 60,
            skills_json TEXT NOT NULL DEFAULT '[]',
            resume_quality_json TEXT,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS roadmap_progress (
            target_role TEXT PRIMARY KEY,
            completed_days_json TEXT NOT NULL DEFAULT '[]',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS job_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL,
            result_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            job_title TEXT NOT NULL,
            job_url TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'saved',
            deadline TEXT NOT NULL DEFAULT '',
            applied_date TEXT NOT NULL DEFAULT '',
            follow_up_date TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    connection.execute(
        "INSERT OR IGNORE INTO profile (id) VALUES (1)",
    )
    connection.commit()
    return connection


def get_profile() -> dict[str, Any]:
    with _connection() as connection:
        row = connection.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    result = dict(row)
    result["skills"] = json.loads(result.pop("skills_json"))
    result["resume_quality"] = (
        json.loads(result.pop("resume_quality_json"))
        if result.get("resume_quality_json")
        else None
    )
    result.pop("id", None)
    return result


def update_profile(values: dict[str, Any]) -> dict[str, Any]:
    allowed = {
        "name",
        "target_role",
        "experience_level",
        "daily_minutes",
        "skills",
        "resume_quality",
    }
    updates = {key: value for key, value in values.items() if key in allowed}
    columns = {
        "skills": "skills_json",
        "resume_quality": "resume_quality_json",
    }
    assignments: list[str] = []
    parameters: list[Any] = []
    for key, value in updates.items():
        assignments.append(f"{columns.get(key, key)} = ?")
        parameters.append(json.dumps(value) if key in columns else value)
    if assignments:
        assignments.append("updated_at = CURRENT_TIMESTAMP")
        with _connection() as connection:
            connection.execute(
                f"UPDATE profile SET {', '.join(assignments)} WHERE id = 1",
                parameters,
            )
            connection.commit()
    return get_profile()


def save_job_match(title: str, company: str, description: str, result: dict[str, Any]) -> dict[str, Any]:
    with _connection() as connection:
        cursor = connection.execute(
            "INSERT INTO job_matches (title, company, description, result_json) VALUES (?, ?, ?, ?)",
            (title, company, description, json.dumps(result)),
        )
        connection.commit()
        return {
            "id": cursor.lastrowid,
            "title": title,
            "company": company,
            "description": description,
            "result": result,
        }


def list_job_matches() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT id, title, company, description, result_json, created_at "
            "FROM job_matches ORDER BY id DESC"
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "company": row["company"],
            "description": row["description"],
            "result": json.loads(row["result_json"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


def get_roadmap_progress(target_role: str) -> list[int]:
    with _connection() as connection:
        row = connection.execute(
            "SELECT completed_days_json FROM roadmap_progress WHERE target_role = ?",
            (target_role,),
        ).fetchone()
    return json.loads(row["completed_days_json"]) if row else []


def save_roadmap_progress(target_role: str, completed_days: list[int]) -> list[int]:
    normalized = sorted(set(completed_days))
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO roadmap_progress (target_role, completed_days_json)
            VALUES (?, ?)
            ON CONFLICT(target_role) DO UPDATE SET
                completed_days_json = excluded.completed_days_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (target_role, json.dumps(normalized)),
        )
        connection.commit()
    return normalized


APPLICATION_STATUSES = ("saved", "applied", "interview", "offer", "rejected", "withdrawn")


def _application_record(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def list_applications(status: str | None = None) -> list[dict[str, Any]]:
    with _connection() as connection:
        if status:
            rows = connection.execute(
                "SELECT * FROM applications WHERE status = ? ORDER BY updated_at DESC, id DESC",
                (status,),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM applications ORDER BY updated_at DESC, id DESC"
            ).fetchall()
    return [_application_record(row) for row in rows]


def create_application(values: dict[str, Any]) -> dict[str, Any]:
    fields = (
        "company",
        "job_title",
        "job_url",
        "status",
        "deadline",
        "applied_date",
        "follow_up_date",
        "notes",
    )
    parameters = [values.get(field, "") for field in fields]
    with _connection() as connection:
        cursor = connection.execute(
            f"INSERT INTO applications ({', '.join(fields)}) VALUES ({', '.join('?' for _ in fields)})",
            parameters,
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return _application_record(row)


def update_application(application_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {
        "company",
        "job_title",
        "job_url",
        "status",
        "deadline",
        "applied_date",
        "follow_up_date",
        "notes",
    }
    updates = {key: value for key, value in values.items() if key in allowed}
    if not updates:
        return next(
            (item for item in list_applications() if item["id"] == application_id),
            None,
        )
    assignments = [f"{key} = ?" for key in updates]
    parameters = list(updates.values()) + [application_id]
    with _connection() as connection:
        cursor = connection.execute(
            f"UPDATE applications SET {', '.join(assignments)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            parameters,
        )
        connection.commit()
        if cursor.rowcount == 0:
            return None
        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?", (application_id,)
        ).fetchone()
    return _application_record(row)


def delete_application(application_id: int) -> bool:
    with _connection() as connection:
        cursor = connection.execute(
            "DELETE FROM applications WHERE id = ?", (application_id,)
        )
        connection.commit()
    return cursor.rowcount > 0
