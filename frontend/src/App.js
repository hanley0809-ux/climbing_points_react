import React, { useState, useEffect } from 'react';
import './App.css';

// Grade scales defined as a constant outside the component
const GRADE_SCALES = {
    "Bouldering": {
        "Stonegoat": ["Red", "Red/Orange", "Orange", "Orange/Yellow", "Yellow", "Yellow/Green", "Green", "Green/Blue", "Blue"],
        "Balance": ["1", "2", "3", "4", "5", "6", "7", "8"]
    },
    "Sport Climbing": {
        "Default": ["5a", "5b", "5c", "6a", "6a+", "6b", "6b+", "6c", "6c+", "7a", "7a+", "7b", "7b+", "7c", "7c+", "8a"]
    }
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

function App() {
    // State Management
    const [userName, setUserName] = useState('');
    const [sessionActive, setSessionActive] = useState(false);
    const [discipline, setDiscipline] = useState('Bouldering');
    const [gym, setGym] = useState('Stonegoat');
    const [currentSessionClimbs, setCurrentSessionClimbs] = useState([]);
    const [stats, setStats] = useState({ total_sessions: 0, hardest_boulder: 'N/A', hardest_sport: 'N/A' });
    const [pastSessions, setPastSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Effect to load user name from localStorage on initial render
    useEffect(() => {
        const storedName = localStorage.getItem('climberName');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    // --- API Communication ---

    const handleStartSession = async () => {
        if (!userName.trim()) {
            alert("Please enter your name to start a session.");
            return;
        }
        localStorage.setItem('climberName', userName.trim());
        setIsLoading(true);
        try {
            // Fetch stats and past sessions concurrently
            const [statsResponse, sessionsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/stats/${userName}`),
                fetch(`${API_BASE_URL}/api/sessions/${userName}`)
            ]);

            if (!statsResponse.ok || !sessionsResponse.ok) {
                throw new Error('Failed to fetch initial data. Make sure the API is running.');
            }

            const statsData = await statsResponse.json();
            const sessionsData = await sessionsResponse.json();

            setStats(statsData);
            setPastSessions(sessionsData);
            setSessionActive(true);

        } catch (error) {
            console.error("Error starting session:", error);
            alert(`Could not start session: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishSession = async () => {
        if (currentSessionClimbs.length === 0) {
            setCurrentSessionClimbs([]);
            setSessionActive(false);
            return;
        }

        setIsLoading(true);
        
        const sessionName = discipline === "Bouldering" ? `${gym} - ${discipline}` : discipline;

        const payload = {
            userName: userName,
            sessionName: sessionName,
            climbs: currentSessionClimbs.map(climb => ({
                Discipline: climb.discipline,
                Grade: climb.grade,
                Timestamp: climb.timestamp,
                Gym: climb.gym
            })),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to save session to the server.');
            }

            setCurrentSessionClimbs([]);
            setSessionActive(false);
            alert("Session saved successfully! 🎉");

        } catch (error) {
            console.error("Error finishing session:", error);
            alert(`Could not save session: ${error.message}. Your climbs are still visible. Please try again or copy them manually.`);
        } finally {
            setIsLoading(false);
        }
    };


    // --- Helper Functions ---

    const handleNameChange = (e) => {
        setUserName(e.target.value);
    };

    const handleLogClimb = (grade) => {
        const newClimb = {
            id: Date.now(),
            grade: grade,
            timestamp: new Date().toISOString(),
            discipline: discipline,
            gym: discipline === "Bouldering" ? gym : "",
        };
        setCurrentSessionClimbs(prevClimbs => [newClimb, ...prevClimbs]);
    };

    const handleDeleteClimb = (climbId) => {
        setCurrentSessionClimbs(prevClimbs => prevClimbs.filter(climb => climb.id !== climbId));
    };

    const getGrades = () => {
        if (discipline === "Bouldering") {
            return GRADE_SCALES.Bouldering[gym] || [];
        }
        return GRADE_SCALES["Sport Climbing"].Default;
    };


    // --- Component Rendering ---

    const renderStartForm = () => (
        <div className="card start-form">
            <h2>Start a New Session</h2>
            <input
                type="text"
                value={userName}
                onChange={handleNameChange}
                placeholder="Enter Your Name"
                className="input-field"
            />
            <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="input-field">
                <option value="Bouldering">Bouldering</option>
                <option value="Sport Climbing">Sport Climbing</option>
            </select>
            {discipline === 'Bouldering' && (
                <select value={gym} onChange={e => setGym(e.target.value)} className="input-field">
                    <option value="Stonegoat">Stonegoat</option>
                    <option value="Balance">Balance</option>
                </select>
            )}
            {/* CHANGED: Updated button text and className */}
            <button onClick={handleStartSession} disabled={isLoading || !userName.trim()} className="btn-primary btn-send-it">
                {isLoading ? 'Loading...' : "Let's send it!"}
            </button>
        </div>
    );

    const renderMainApp = () => (
        <div>
            {/* Dashboard Section */}
            <div className="card dashboard">
                <h3>Dashboard for {userName}</h3>
                <div className="metrics-container">
                    <div className="metric-card">
                        <h4>Total Sessions</h4>
                        <p>{stats.total_sessions}</p>
                    </div>
                    <div className="metric-card">
                        <h4>Hardest Boulder</h4>
                        <p>{stats.hardest_boulder}</p>
                    </div>
                    <div className="metric-card">
                        <h4>Top Sport Grade</h4>
                        <p>{stats.hardest_sport}</p>
                    </div>
                </div>
            </div>

            {/* Log a Climb Section */}
            <div className="card">
                <h3>Log a Climb</h3>
                <div className="grade-buttons-container">
                    {getGrades().map(grade => {
                        const gradeClass = `grade-${grade.replace(/\//g, '-')}`;
                        return (
                            <div key={grade} className={`grade-button-wrapper ${gradeClass}`}>
                                <button onClick={() => handleLogClimb(grade)}>{grade}</button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Session & Past Sessions Side-by-Side */}
            <div className="sessions-container">
                {/* Current Session Section */}
                <div className="card current-session">
                    <h3>Current Session ({currentSessionClimbs.length})</h3>
                    <ul className="climb-list">
                        {currentSessionClimbs.map((climb) => (
                            <li key={climb.id}>
                                <span>{climb.grade}</span>
                                <button onClick={() => handleDeleteClimb(climb.id)} className="btn-delete">×</button>
                            </li>
                        ))}
                        {currentSessionClimbs.length === 0 && <p className="placeholder-text">No climbs logged yet.</p>}
                    </ul>
                </div>

                {/* Past Sessions Section */}
                <div className="card past-sessions">
                    <h3>Past Sessions</h3>
                    <div className="past-sessions-list">
                    {pastSessions.length > 0 ? pastSessions.map((session, index) => (
                        <details key={index} className="session-details">
                            <summary>
                                {session.session_name} ({new Date(session.session_date).toLocaleDateString()})
                            </summary>
                            <ul>
                                {session.climbs.map((climb, climbIndex) => (
                                    <li key={climbIndex}>{climb.grade} ({climb.discipline})</li>
                                ))}
                            </ul>
                        </details>
                    )) : <p className="placeholder-text">No past sessions found.</p>}
                    </div>
                </div>
            </div>

            <button onClick={handleFinishSession} disabled={isLoading} className="btn-finish">
                 {isLoading ? 'Saving...' : 'Finish and Save Session'}
            </button>
        </div>
    );


    return (
        <div className="container">
            <header className="app-header">
                {/* CHANGED: Updated title */}
                <h1>🧗‍♂️ Climbing Points</h1>
            </header>
            <main>
                {sessionActive ? renderMainApp() : renderStartForm()}
            </main>
        </div>
    );
}

export default App;