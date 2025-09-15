# backend/app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

# Import helper functions from the local utility module
import backend_utils

# --- App Initialization & Configuration ---

app = Flask(__name__)

# Define the list of websites that are allowed to make requests to this API
origins = [
    "http://localhost:3000",                 # For local development
    "https://climbing-points.onrender.com",  # Your live frontend URL
    "https://climbingpoints.com",            # Your future custom domain
    "https://www.climbingpoints.com"         # Your custom domain with www
]
# Initialize CORS with the list of allowed origins
CORS(app, resources={r"/api/*": {"origins": origins}})

# Initialize the database and create the table if it doesn't exist
# This will run once when the application starts.
backend_utils.init_db()


# --- API Endpoints ---

@app.route("/api/stats/<user_name>", methods=["GET"])
def get_stats(user_name):
    """Returns key dashboard statistics for a given user."""
    all_climbs_df = backend_utils.get_all_climbs() # No longer needs worksheet
    if all_climbs_df.empty:
        return jsonify(backend_utils.get_dashboard_stats(pd.DataFrame()))

    user_df = all_climbs_df[all_climbs_df["Name"] == user_name]
    stats = backend_utils.get_dashboard_stats(user_df)
    
    return jsonify(stats)


@app.route("/api/sessions/<user_name>", methods=["GET"])
def get_sessions(user_name):
    """Returns all past climbing sessions for a user as a list of objects."""
    all_climbs_df = backend_utils.get_all_climbs() # No longer needs worksheet
    if all_climbs_df.empty:
        return jsonify([])
    
    user_df = all_climbs_df[all_climbs_df["Name"] == user_name]

    if user_df.empty or 'Session' not in user_df.columns:
        return jsonify([])

    df_sorted_by_date = user_df.sort_values(by='Date', ascending=False)
    grouped_by_session = df_sorted_by_date.groupby('Session')
    
    sessions_list = []
    for session_name, session_df in grouped_by_session:
        session_date_val = session_df['Date'].iloc[0]
        session_date = session_date_val.strftime('%Y-%m-%d') if pd.notna(session_date_val) else None
        
        session_df_cleaned = session_df.astype(object).where(pd.notnull(session_df), None)
        climbs_in_session = session_df_cleaned.to_dict('records')
        
        sessions_list.append({
            "session_name": session_name,
            "session_date": session_date,
            "climbs": climbs_in_session
        })
    
    return jsonify(sessions_list)


@app.route("/api/session", methods=["POST"])
def add_session():
    """Saves a new session's climbs to the database."""
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