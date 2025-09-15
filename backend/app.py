#
# Main Flask Application for Climbing Tracker API
#
# To run this application:
# 1. Make sure you have a `secrets.toml` file in the same directory
#    with your Google Cloud service account credentials under the
#    [gcp_service_account] key.
# 2. Ensure `backend_utils.py` is in the same directory.
# 3. Install dependencies:
#    pip install Flask Flask-CORS gspread pandas toml
# 4. Run the app:
#    python app.py
#

import toml
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

# Import helper functions from the local utility module
import backend_utils

# --- App Initialization & Configuration ---

app = Flask(__name__)
# MODIFIED: More specific CORS configuration for better security and clarity.
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Load secrets and initialize the Google Sheet connection once on startup.
try:
    secrets = toml.load("secrets.toml")
    # Establish a connection to the Google Sheet worksheet
    worksheet = backend_utils.get_worksheet(secrets["gcp_service_account"])
except FileNotFoundError:
    print("❌ Error: `secrets.toml` not found. Please create this file.")
    worksheet = None
except Exception as e:
    print(f"❌ An error occurred during worksheet initialization: {e}")
    worksheet = None


# --- API Endpoints ---

@app.route("/api/stats/<user_name>", methods=["GET"])
def get_stats(user_name):
    """
    Returns key dashboard statistics for a given user.
    """
    if not worksheet:
        return jsonify({"error": "Server error: Worksheet not initialized"}), 500

    all_climbs_df = backend_utils.get_all_climbs(worksheet)
    if all_climbs_df.empty:
        return jsonify(backend_utils.get_dashboard_stats(pd.DataFrame()))

    user_df = all_climbs_df[all_climbs_df["Name"] == user_name]
    stats = backend_utils.get_dashboard_stats(user_df)
    
    return jsonify(stats)


@app.route("/api/sessions/<user_name>", methods=["GET"])
def get_sessions(user_name):
    """
    Returns all past climbing sessions for a user as a list of objects.
    """
    if not worksheet:
        return jsonify({"error": "Server error: Worksheet not initialized"}), 500
        
    all_climbs_df = backend_utils.get_all_climbs(worksheet)
    if all_climbs_df.empty:
        return jsonify([])
    
    user_df = all_climbs_df[all_climbs_df["Name"] == user_name]

    if user_df.empty or 'Session' not in user_df.columns:
        return jsonify([])

    df_sorted_by_date = user_df.sort_values(by='Date', ascending=False)
    grouped_by_session = df_sorted_by_date.groupby('Session')
    
    sessions_list = []
    for session_name, session_df in grouped_by_session:
        # Get the date from the first row (most recent climb)
        session_date_val = session_df['Date'].iloc[0]
        # Ensure NaT doesn't cause an error during string formatting
        session_date = session_date_val.strftime('%Y-%m-%d') if pd.notna(session_date_val) else None
        
        # MODIFIED: Clean the DataFrame by replacing NaT with None before converting to dictionary
        # This prevents the jsonify error.
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
    """
    Saves a new session's climbs to the Google Sheet.
    Expects a JSON payload with 'climbs', 'userName', and 'sessionName'.
    """
    if not worksheet:
        return jsonify({"error": "Server error: Worksheet not initialized"}), 500

    data = request.get_json()

    # MODIFIED: Add debugging print statements to see the incoming data
    print("--- RECEIVED DATA FOR /api/session ---")
    print(data)
    print("--------------------------------------")

    # MODIFIED: Check for camelCase keys sent from the JavaScript frontend
    climbs_to_save = data.get("climbs")
    user_name = data.get("userName")
    session_name = data.get("sessionName")

    # MODIFIED: Updated check for the correct keys
    if not climbs_to_save or not user_name:
        return jsonify({"status": "error", "message": "Missing 'climbs' or 'userName' in request body"}), 400

    try:
        backend_utils.save_new_session(worksheet, climbs_to_save, user_name, session_name)
        return jsonify({"status": "success", "message": "Session saved successfully."}), 201
    except Exception as e:
        print(f"ERROR saving session: {e}") # MODIFIED: Added print on error
        return jsonify({"status": "error", "message": str(e)}), 500


# --- Main Execution ---

if __name__ == "__main__":
    app.run(debug=True, port=5001)