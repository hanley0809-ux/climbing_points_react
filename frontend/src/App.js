import React, { useState } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import ActiveSession from './pages/ActiveSession';

function App() {
    // A user name is needed for API calls. For a real multi-user app, you'd have a login system.
    // For now, we'll use a hardcoded name.
    const userName = "Mark"; // Or "Priya", "Chloe"

    const [activeSession, setActiveSession] = useState(null);
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

    const handleStartSession = async (location) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, location }),
            });
            const data = await response.json();
            setActiveSession({ id: data.session_id, location, startTime: data.start_time, climbs: [] });
        } catch (error) {
            console.error("Could not start session:", error);
        }
    };

    const handleLogClimb = (climb) => {
        setActiveSession(prev => ({ ...prev, climbs: [climb, ...prev.climbs] }));
    };

    const handleEndSession = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/session/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: activeSession.id }),
            });
            setActiveSession(null);
        } catch (error) {
            console.error("Could not end session:", error);
        }
    };

    return (
        <div className="container">
            {activeSession ? (
                <ActiveSession session={activeSession} onLogClimb={handleLogClimb} onEndSession={handleEndSession} />
            ) : (
                <Dashboard userName={userName} onStartSession={handleStartSession} />
            )}
        </div>
    );
}

export default App;