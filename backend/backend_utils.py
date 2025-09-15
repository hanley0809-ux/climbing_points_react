# backend/backend_utils.py

import pandas as pd
from datetime import datetime
import os
from sqlalchemy import create_engine, text

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise Exception("DATABASE_URL environment variable is not set.")

engine = create_engine(DB_URL)

GRADE_ORDER = [
    "8a", "7c+", "7c", "7b+", "7b", "7a+", "7a", "6c+", "6c", "6b+", "6b", "6a+", "6a", "5c", "5b", "5a",
    "V10", "V9", "V8", "V7", "V6", "V5", "V4", "V3", "V2", "V1", "V0",
    "Blue", "Green/Blue", "Green", "Yellow/Green", "Yellow", "Orange/Yellow", "Orange", "Red/Orange", "Red",
    "8", "7", "6", "5", "4", "3", "2", "1"
]

def init_db():
    """Creates the database table if it doesn't already exist."""
    # Use lowercase for all column names to match database standards
    create_table_query = text('''
        CREATE TABLE IF NOT EXISTS climbs (
            id SERIAL PRIMARY KEY,
            discipline TEXT NOT NULL,
            grade TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            session TEXT NOT NULL,
            date TEXT NOT NULL,
            gym TEXT,
            name TEXT NOT NULL
        )
    ''')
    try:
        with engine.connect() as connection:
            connection.execute(create_table_query)
            connection.commit()
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")


def get_all_climbs():
    """Fetches all records from the PostgreSQL database."""
    df = pd.read_sql_query("SELECT * FROM climbs", engine)
    
    if 'timestamp' in df.columns and not df.empty:
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
    if 'date' in df.columns and not df.empty:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
    return df

def save_new_session(climbs_to_save, user_name, session_name=None):
    """Saves a new session's climbs to the PostgreSQL database."""
    session_date = datetime.now().strftime("%Y-%m-%d")
    final_session_name = session_name if session_name else f"Session from {session_date}"

    insert_query = text('''
        INSERT INTO climbs (discipline, grade, timestamp, session, date, gym, name)
        VALUES (:discipline, :grade, :timestamp, :session, :date, :gym, :name)
    ''')
    
    with engine.connect() as connection:
        for climb in climbs_to_save:
            connection.execute(insert_query, {
                "discipline": climb.get("Discipline"),
                "grade": climb.get("Grade"),
                "timestamp": climb.get("Timestamp"),
                "session": final_session_name,
                "date": session_date,
                "gym": climb.get("Gym", ""),
                "name": user_name
            })
        connection.commit()

def get_dashboard_stats(df):
    # MODIFIED: Use lowercase column names to match the DataFrame
    if df.empty or 'session' not in df.columns:
        return {"total_sessions": 0, "hardest_boulder": "N/A", "hardest_sport": "N/A"}

    total_sessions = df['session'].nunique()

    def find_hardest(discipline):
        # MODIFIED: Use lowercase column names
        discipline_df = df[df['discipline'] == discipline]
        if discipline_df.empty: return "N/A"
        discipline_df['grade'] = pd.Categorical(discipline_df['grade'], categories=GRADE_ORDER, ordered=True)
        return discipline_df['grade'].min()

    hardest_boulder = find_hardest("Bouldering")
    hardest_sport = find_hardest("Sport Climbing")

    return {"total_sessions": total_sessions, "hardest_boulder": hardest_boulder, "hardest_sport": hardest_sport}

def get_session_summary(session_df):
    total_climbs = len(session_df)
    # MODIFIED: Use lowercase column name
    session_df['grade'] = pd.Categorical(session_df['grade'], categories=GRADE_ORDER, ordered=True)
    hardest_climb = session_df['grade'].min()
    return {"total_climbs": total_climbs, "hardest_climb": hardest_climb}