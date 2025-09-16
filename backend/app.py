# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
import backend_utils # For engine and init_db

app = Flask(__name__)
# ... (your CORS setup from before)
backend_utils.init_db()
engine = backend_utils.engine

# This GRADE_ORDER list is crucial for sorting climbs by difficulty
GRADE_ORDER = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10"] # Simplified for example

@app.route("/api/dashboard/<user_name>", methods=["GET"])
def get_dashboard_data(user_name):
    with engine.connect() as connection:
        # --- KPIs ---
        total_sessions = connection.execute(text("SELECT COUNT(*) FROM sessions WHERE user_name = :name"), {"name": user_name}).scalar_one()

        # Hardest Send in last 30 days
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        sends_30d_df = pd.read_sql_query(
            text("""
                SELECT c.grade FROM climbs c JOIN sessions s ON c.session_id = s.id
                WHERE s.user_name = :name AND c.ascent_type IN ('Send', 'Flash') AND s.start_time >= :date
            """),
            connection,
            params={"name": user_name, "date": thirty_days_ago}
        )
        hardest_send_30_days = "N/A"
        if not sends_30d_df.empty:
            sends_30d_df['grade'] = pd.Categorical(sends_30d_df['grade'], categories=GRADE_ORDER, ordered=True)
            hardest_send_30_days = sends_30d_df['grade'].min()

        # Current Project (hardest attempt)
        attempts_df = pd.read_sql_query(
            text("""
                SELECT c.grade FROM climbs c JOIN sessions s ON c.session_id = s.id
                WHERE s.user_name = :name AND c.ascent_type = 'Attempt'
            """),
            connection,
            params={"name": user_name}
        )
        current_project = "N/A"
        if not attempts_df.empty:
            attempts_df['grade'] = pd.Categorical(attempts_df['grade'], categories=GRADE_ORDER, ordered=True)
            current_project = attempts_df['grade'].min()

        # --- Grade Pyramid ---
        pyramid_df = pd.read_sql_query(
            text("""
                SELECT grade, COUNT(*) as count FROM climbs c JOIN sessions s ON c.session_id = s.id
                WHERE s.user_name = :name AND c.ascent_type IN ('Send', 'Flash')
                GROUP BY grade
            """),
            connection,
            params={"name": user_name}
        )
        pyramid_data = pd.Series(pyramid_df.count.values, index=pyramid_df.grade).to_dict()

        # --- Recent Activity ---
        recent_sessions = connection.execute(text("""
            SELECT id, location, start_time FROM sessions
            WHERE user_name = :name ORDER BY start_time DESC LIMIT 3
        """), {"name": user_name}).mappings().all()

    return jsonify({
        "hardest_send_30_days": hardest_send_30_days,
        "total_sessions": total_sessions,
        "current_project": current_project,
        "pyramid_data": pyramid_data,
        "recent_sessions": [{"id": r.id, "location": r.location, "date": r.start_time.isoformat()} for r in recent_sessions]
    })

@app.route("/api/session/start", methods=["POST"])
def start_session():
    data = request.get_json()
    user_name = data.get("userName")
    location = data.get("location")
    start_time = datetime.now(timezone.utc)

    with engine.connect() as connection:
        result = connection.execute(text("""
            INSERT INTO sessions (user_name, location, start_time)
            VALUES (:user_name, :location, :start_time)
            RETURNING id
        """), {
            "user_name": user_name, "location": location, "start_time": start_time
        })
        session_id = result.scalar_one()
        connection.commit()

    return jsonify({"session_id": session_id, "start_time": start_time.isoformat()}), 201

@app.route("/api/climb", methods=["POST"])
def log_climb():
    data = request.get_json()
    with engine.connect() as connection:
        connection.execute(text("""
            INSERT INTO climbs (session_id, climbing_type, grade, ascent_type, notes, logged_at)
            VALUES (:session_id, :climbing_type, :grade, :ascent_type, :notes, :logged_at)
        """), {
            "session_id": data.get("session_id"),
            "climbing_type": data.get("climbing_type"),
            "grade": data.get("grade"),
            "ascent_type": data.get("ascent_type"),
            "notes": data.get("notes"),
            "logged_at": datetime.now(timezone.utc)
        })
        connection.commit()
    return jsonify({"message": "Climb logged successfully"}), 201

@app.route("/api/session/end", methods=["POST"])
def end_session():
    data = request.get_json()
    session_id = data.get("session_id")
    with engine.connect() as connection:
        connection.execute(text("""
            UPDATE sessions SET end_time = :end_time WHERE id = :session_id
        """), {"end_time": datetime.now(timezone.utc), "session_id": session_id})
        connection.commit()
    return jsonify({"message": "Session ended successfully"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)