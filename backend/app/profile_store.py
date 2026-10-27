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
        CREATE TABLE IF NOT EXISTS roadmap_progress_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_role TEXT NOT NULL,
            completed_days_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_role TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            question_count INTEGER NOT NULL,
            score REAL NOT NULL,
            answers_json TEXT NOT NULL DEFAULT '[]',
            recurring_gaps_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS portfolio_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_role TEXT NOT NULL,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'planned',
            project_json TEXT NOT NULL,
            github_url TEXT NOT NULL DEFAULT '',
            demo_url TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            completed_milestones_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS resume_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_role TEXT NOT NULL,
            version_name TEXT NOT NULL DEFAULT '',
            summary TEXT NOT NULL DEFAULT '',
            score INTEGER NOT NULL DEFAULT 0,
            result_json TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS copilot_action_states (
            action_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS copilot_preferences (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            reminders_enabled INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS copilot_workflows (
            application_id INTEGER PRIMARY KEY,
            steps_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS copilot_plan_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            period TEXT NOT NULL,
            estimated_minutes INTEGER,
            destination TEXT NOT NULL DEFAULT 'roadmap',
            completed INTEGER NOT NULL DEFAULT 0,
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
        connection.execute(
            "INSERT INTO roadmap_progress_history (target_role, completed_days_json) VALUES (?, ?)",
            (target_role, json.dumps(normalized)),
        )
        connection.commit()
    return normalized


def list_roadmap_progress_history(target_role: str) -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT completed_days_json, created_at FROM roadmap_progress_history "
            "WHERE target_role = ? ORDER BY id ASC",
            (target_role,),
        ).fetchall()
    return [
        {
            "completed_days": json.loads(row["completed_days_json"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


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


def save_interview_session(
    target_role: str,
    difficulty: str,
    question_count: int,
    score: float,
    answers: list[dict[str, Any]],
    recurring_gaps: list[str],
) -> dict[str, Any]:
    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO interview_sessions
            (target_role, difficulty, question_count, score, answers_json, recurring_gaps_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                target_role,
                difficulty,
                question_count,
                score,
                json.dumps(answers),
                json.dumps(recurring_gaps),
            ),
        )
        connection.commit()
    return {
        "id": cursor.lastrowid,
        "target_role": target_role,
        "difficulty": difficulty,
        "question_count": question_count,
        "score": score,
        "answers": answers,
        "recurring_gaps": recurring_gaps,
    }


def list_interview_sessions() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT * FROM interview_sessions ORDER BY id DESC"
        ).fetchall()
    return [
        {
            "id": row["id"],
            "target_role": row["target_role"],
            "difficulty": row["difficulty"],
            "question_count": row["question_count"],
            "score": row["score"],
            "answers": json.loads(row["answers_json"]),
            "recurring_gaps": json.loads(row["recurring_gaps_json"]),
            "created_at": row["created_at"],
        }
        for row in rows
    ]


PROJECT_STATUSES = ("planned", "in_progress", "completed")


def save_portfolio_project(project: dict[str, Any]) -> dict[str, Any]:
    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO portfolio_projects (target_role, title, project_json)
            VALUES (?, ?, ?)
            """,
            (project["target_role"], project["title"], json.dumps(project)),
        )
        connection.commit()
    return get_portfolio_project(cursor.lastrowid)


def list_portfolio_projects() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT * FROM portfolio_projects ORDER BY updated_at DESC, id DESC"
        ).fetchall()
    return [_portfolio_record(row) for row in rows]


def _portfolio_record(row: sqlite3.Row) -> dict[str, Any]:
    result = json.loads(row["project_json"])
    result.update({
        "id": row["id"],
        "status": row["status"],
        "github_url": row["github_url"],
        "demo_url": row["demo_url"],
        "notes": row["notes"],
        "completed_milestones": json.loads(row["completed_milestones_json"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    })
    return result


def get_portfolio_project(project_id: int) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            "SELECT * FROM portfolio_projects WHERE id = ?", (project_id,)
        ).fetchone()
    return _portfolio_record(row) if row else None


def update_portfolio_project(project_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {"status", "github_url", "demo_url", "notes", "completed_milestones"}
    updates = {key: value for key, value in values.items() if key in allowed}
    if "completed_milestones" in updates:
        updates["completed_milestones_json"] = json.dumps(sorted(set(updates.pop("completed_milestones"))))
    if not updates:
        return get_portfolio_project(project_id)
    assignments = [f"{key} = ?" for key in updates]
    parameters = list(updates.values()) + [project_id]
    with _connection() as connection:
        cursor = connection.execute(
            f"UPDATE portfolio_projects SET {', '.join(assignments)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            parameters,
        )
        connection.commit()
    return get_portfolio_project(project_id) if cursor.rowcount else None


def save_resume_version(target_role: str, version_name: str, summary: str, score: int, result: dict[str, Any]) -> dict[str, Any]:
    clean_name = (version_name or f"{target_role} draft").strip() or f"{target_role} draft"
    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO resume_versions (target_role, version_name, summary, score, result_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (target_role, clean_name, summary, score, json.dumps(result)),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM resume_versions WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return _resume_version_record(row)


def list_resume_versions(target_role: str | None = None) -> list[dict[str, Any]]:
    with _connection() as connection:
        if target_role:
            rows = connection.execute(
                "SELECT * FROM resume_versions WHERE target_role = ? ORDER BY created_at DESC, id DESC",
                (target_role,),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM resume_versions ORDER BY created_at DESC, id DESC"
            ).fetchall()
    return [_resume_version_record(row) for row in rows]


def delete_resume_version(version_id: int) -> bool:
    with _connection() as connection:
        cursor = connection.execute(
            "DELETE FROM resume_versions WHERE id = ?",
            (version_id,),
        )
        connection.commit()
    return cursor.rowcount > 0


def _resume_version_record(row: sqlite3.Row) -> dict[str, Any]:
    payload = json.loads(row["result_json"]) if row["result_json"] else {}
    return {
        "id": row["id"],
        "target_role": row["target_role"],
        "version_name": row["version_name"],
        "summary": row["summary"],
        "score": row["score"],
        "result": payload,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_copilot_action_states() -> dict[str, str]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT action_id, status FROM copilot_action_states"
        ).fetchall()
    return {row["action_id"]: row["status"] for row in rows}


def update_copilot_action_state(action_id: str, status: str) -> dict[str, str]:
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO copilot_action_states (action_id, status)
            VALUES (?, ?)
            ON CONFLICT(action_id) DO UPDATE SET
                status = excluded.status,
                updated_at = CURRENT_TIMESTAMP
            """,
            (action_id, status),
        )
        connection.commit()
    return {"id": action_id, "status": status}


def get_copilot_preferences() -> dict[str, bool]:
    with _connection() as connection:
        connection.execute("INSERT OR IGNORE INTO copilot_preferences (id) VALUES (1)")
        row = connection.execute(
            "SELECT reminders_enabled FROM copilot_preferences WHERE id = 1"
        ).fetchone()
        connection.commit()
    return {"reminders_enabled": bool(row["reminders_enabled"])}


def update_copilot_preferences(reminders_enabled: bool) -> dict[str, bool]:
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO copilot_preferences (id, reminders_enabled)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                reminders_enabled = excluded.reminders_enabled,
                updated_at = CURRENT_TIMESTAMP
            """,
            (int(reminders_enabled),),
        )
        connection.commit()
    return {"reminders_enabled": reminders_enabled}


def get_copilot_workflow(application_id: int) -> dict[str, Any] | None:
    with _connection() as connection:
        row = connection.execute(
            "SELECT application_id, steps_json, created_at, updated_at "
            "FROM copilot_workflows WHERE application_id = ?",
            (application_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "application_id": row["application_id"],
        "steps": json.loads(row["steps_json"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def save_copilot_workflow(application_id: int, steps: list[dict[str, Any]]) -> dict[str, Any]:
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO copilot_workflows (application_id, steps_json)
            VALUES (?, ?)
            ON CONFLICT(application_id) DO NOTHING
            """,
            (application_id, json.dumps(steps)),
        )
        connection.commit()
    workflow = get_copilot_workflow(application_id)
    if workflow is None:
        raise RuntimeError("Copilot workflow could not be loaded after saving.")
    return workflow


def update_copilot_workflow_step(
    application_id: int,
    step_id: str,
    completed: bool,
) -> dict[str, Any] | None:
    workflow = get_copilot_workflow(application_id)
    if workflow is None:
        return None
    step_found = False
    for step in workflow["steps"]:
        if step["id"] == step_id:
            step["completed"] = completed
            step_found = True
            break
    if not step_found:
        return None
    with _connection() as connection:
        connection.execute(
            "UPDATE copilot_workflows SET steps_json = ?, updated_at = CURRENT_TIMESTAMP "
            "WHERE application_id = ?",
            (json.dumps(workflow["steps"]), application_id),
        )
        connection.commit()
    return get_copilot_workflow(application_id)


def list_copilot_workflows() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT application_id, steps_json, created_at, updated_at "
            "FROM copilot_workflows ORDER BY updated_at DESC, application_id DESC"
        ).fetchall()
    return [
        {
            "application_id": row["application_id"],
            "steps": json.loads(row["steps_json"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def list_copilot_plan_tasks() -> list[dict[str, Any]]:
    with _connection() as connection:
        rows = connection.execute(
            "SELECT * FROM copilot_plan_tasks ORDER BY completed ASC, id DESC"
        ).fetchall()
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "description": row["description"],
            "period": row["period"],
            "estimated_minutes": row["estimated_minutes"],
            "destination": row["destination"],
            "completed": bool(row["completed"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def create_copilot_plan_task(values: dict[str, Any]) -> dict[str, Any]:
    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO copilot_plan_tasks
                (title, description, period, estimated_minutes, destination)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                values["title"],
                values.get("description", ""),
                values["period"],
                values.get("estimated_minutes"),
                values.get("destination", "roadmap"),
            ),
        )
        connection.commit()
        row = connection.execute(
            "SELECT * FROM copilot_plan_tasks WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "period": row["period"],
        "estimated_minutes": row["estimated_minutes"],
        "destination": row["destination"],
        "completed": bool(row["completed"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def update_copilot_plan_task(task_id: int, values: dict[str, Any]) -> dict[str, Any] | None:
    allowed = {
        "title",
        "description",
        "period",
        "estimated_minutes",
        "destination",
        "completed",
    }
    updates = {key: value for key, value in values.items() if key in allowed}
    if "completed" in updates:
        updates["completed"] = int(updates["completed"])
    if not updates:
        return next((task for task in list_copilot_plan_tasks() if task["id"] == task_id), None)
    with _connection() as connection:
        cursor = connection.execute(
            f"UPDATE copilot_plan_tasks SET "
            f"{', '.join(f'{key} = ?' for key in updates)}, "
            "updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [*updates.values(), task_id],
        )
        connection.commit()
        if cursor.rowcount == 0:
            return None
        row = connection.execute(
            "SELECT * FROM copilot_plan_tasks WHERE id = ?",
            (task_id,),
        ).fetchone()
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "period": row["period"],
        "estimated_minutes": row["estimated_minutes"],
        "destination": row["destination"],
        "completed": bool(row["completed"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def delete_copilot_plan_task(task_id: int) -> bool:
    with _connection() as connection:
        cursor = connection.execute(
            "DELETE FROM copilot_plan_tasks WHERE id = ?",
            (task_id,),
        )
        connection.commit()
    return cursor.rowcount > 0
