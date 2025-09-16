# backend/backend_utils.py
import os
from sqlalchemy import create_engine, text

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise Exception("DATABASE_URL environment variable is not set.")

engine = create_engine(DB_URL)

def init_db():
    """Creates the database tables if they don't already exist."""
    create_sessions_table = text('''
        CREATE TABLE IF NOT EXISTS sessions (
            id SERIAL PRIMARY KEY,
            user_name TEXT NOT NULL,
            location TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE
        );
    ''')
    create_climbs_table = text('''
        CREATE TABLE IF NOT EXISTS climbs (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            climbing_type TEXT,
            grade TEXT NOT NULL,
            ascent_type TEXT NOT NULL,
            tags TEXT,
            notes TEXT,
            media_url TEXT,
            logged_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
    ''')
    try:
        with engine.connect() as connection:
            connection.execute(create_sessions_table)
            connection.execute(create_climbs_table)
            connection.commit()
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")