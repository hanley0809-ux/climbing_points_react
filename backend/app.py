# backend/app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

import backend_utils

# --- App Initialization & Configuration ---

app = Flask(__name__)

origins = [
    "http://localhost:3000",
    "https://climbing-points.onrender.com",
    "https://climbingpoints.com",
    "https://www.climbingpoints.com"
]
CORS(app, resources={r"/api/*": {"origins": origins}})

backend_utils.init_db()

# --- API Endpoints ---

@app.route("/api/stats/<user_name>", methods=["GET"])
def get_stats(user_name):
    all_climbs_df = backend_utils.get_all_climbs()
    if all_climbs_df.empty:
        return jsonify(backend_utils.get_dashboard_stats(pd.DataFrame()))

    user_df = all_climbs_df[all_climbs_df["name"] == user_name]
    stats = backend_utils.get_dashboard_stats(user_df)
    
    return jsonify(stats)


@app.route("/api/sessions/<user_name>", methods=["GET"])
def get_sessions(user_name):
    all_climbs_df = backend_utils.get_all_climbs()
    if all_climbs_df.empty:
        return jsonify([])
    
    user_df = all_climbs_df[all_climbs_df["name"] == user_name]

    # MODIFIED: Use lowercase column names to match the DataFrame
    if user_df.empty or 'session' not in user_df.columns:
        return jsonify([])

    df_sorted_by_date = user_df.sort_values(by='date', ascending=False)
    grouped_by_session = df_sorted_by_date.groupby('session')
    
    sessions_list = []
    for session_name, session_df in grouped_by_session:
        session_date_val = session_df['date'].iloc[0]
        session_date = session_date_val.strftime('%Y-%m-%d') if pd.notna(session_date_val) else None
        
        session_df_cleaned = session_df.astype(object).where(pd.notnull(session_df), None)
        climbs_in_session = session_df_cleaned.to_dict('records')
        
        sessions_list.append({
            "session_name": session_name,
            "session_date": session_date,
            "climbs": climbs_in_session
        })
    
    return jsonify(sessions_list)

# In backend/app.py

@app.route("/api/grade_pyramid/<user_name>", methods=["GET"])
def get_grade_pyramid(user_name):
    """Returns data formatted for the grade pyramid chart."""
    all_climbs_df = backend_utils.get_all_climbs()
    user_df = all_climbs_df[all_climbs_df["name"] == user_name]

    # Filter for successful sends or flashes
    sends_df = user_df[user_df['ascent_type'].isin(['Send', 'Flash'])]

    if sends_df.empty:
        return jsonify({})

    # Count climbs per grade
    pyramid_data = sends_df.groupby('grade').size().to_dict()
    return jsonify(pyramid_data)

@app.route("/api/profile/<user_name>", methods=["GET"])
def get_profile_data(user_name):
    """Returns aggregated data for the user's profile page."""
    all_climbs_df = backend_utils.get_all_climbs()
    user_df = all_climbs_df[all_climbs_df["name"] == user_name]

    if user_df.empty:
        return jsonify({"total_sessions": 0, "progress": [], "achievements": []})

    # This is a simplified example; you can build more complex logic here
    total_sessions = user_df['session'].nunique()

    # For the progress chart (e.g., hardest climb per month)
    # This requires more complex pandas logic, but this is a starting point
    progress_data = user_df.groupby(pd.Grouper(key='date', freq='M'))['grade'].min().reset_index().to_dict('records')

    # Logic to determine achievements would go here
    achievements_data = [] # Placeholder

    return jsonify({
        "total_sessions": total_sessions,
        "progress": progress_data,
        "achievements": achievements_data
    })


@app.route("/api/session", methods=["POST"])
def add_session():
    data = request.get_json()
    
    climbs_to_save = data.get("climbs")
    user_name = data.get("userName")
    session_name = data.get("sessionName")

    if not climbs_to_save or not user_name:
        return jsonify({"status": "error", "message": "Missing 'climbs' or 'userName' in request body"}), 400

    try:
        backend_utils.save_new_session(climbs_to_save, user_name, session_name)
        return jsonify({"status": "success", "message": "Session saved successfully."}), 201
    except Exception as e:
        print(f"ERROR saving session: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# --- Main Execution ---

if __name__ == "__main__":
    app.run(debug=True, port=5001)