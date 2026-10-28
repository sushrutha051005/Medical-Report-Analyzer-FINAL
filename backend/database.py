import sqlite3
import json

DB_NAME = "medical_reports.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            patient_name TEXT,
            report_date TEXT,
            results TEXT,
            summary TEXT
        )
    """)

    conn.commit()
    conn.close()


def save_report(filename, patient_name, report_date, results, summary):
    conn = sqlite3.connect(DB_NAME)

    conn.execute(
        """
        INSERT INTO reports
        (filename, patient_name, report_date, results, summary)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            filename,
            patient_name,
            report_date,
            json.dumps(results),
            summary
        )
    )

    conn.commit()
    conn.close()


def get_reports():
    conn = sqlite3.connect(DB_NAME)

    rows = conn.execute(
        """
        SELECT id, filename, patient_name,
               report_date, results, summary
        FROM reports
        ORDER BY id DESC
        """
    ).fetchall()

    conn.close()

    reports = []

    for row in rows:
        reports.append({
            "id": row[0],
            "filename": row[1],
            "patient_name": row[2],
            "report_date": row[3],
            "results": json.loads(row[4]),
            "summary": row[5]
        })

    return reports