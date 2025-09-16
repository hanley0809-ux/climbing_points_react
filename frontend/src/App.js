import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { SessionProvider } from './contexts/SessionContext';
import BottomNav from './components/BottomNav';
import Logbook from './pages/Logbook';
import Profile from './pages/Profile';
import AddClimb from './pages/AddClimb';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

function StartForm({ onSessionStart }) {
    const [userName, setUserName] = useState('');
    const [discipline, setDiscipline] = useState('Bouldering');
    const [gym, setGym] = useState('Stonegoat');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedName = localStorage.getItem('climberName');
        if (storedName) setUserName(storedName);
    }, []);

    const handleStart = async () => {
        if (!userName.trim()) return alert("Please enter your name.");
        localStorage.setItem('climberName', userName.trim());
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/stats/${userName}`);
            if (!response.ok) throw new Error('Failed to connect to the server. Make sure the API is running.');
            onSessionStart({ userName, discipline, gym });
        } catch (error) {
            alert(`Could not start session: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card start-form">
            <h2>Start a New Session</h2>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter Your Name" className="input-field" />
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="input-field">
                <option value="Bouldering">Bouldering</option>
                <option value="Sport Climbing">Sport Climbing</option>
            </select>
            {discipline === 'Bouldering' && (
                <select value={gym} onChange={(e) => setGym(e.target.value)} className="input-field">
                    <option value="Stonegoat">Stonegoat</option>
                    <option value="Balance">Balance</option>
                </select>
            )}
            <button onClick={handleStart} disabled={isLoading || !userName.trim()} className="btn-primary btn-send-it">
                {isLoading ? 'Warming up...' : "Let's send it!"}
            </button>
        </div>
    );
}

function App() {
    const [sessionData, setSessionData] = useState(null);
    const handleSessionStart = (data) => setSessionData(data);
    const handleSessionEnd = () => setSessionData(null);

    return (
        <div className="container">
            {!sessionData ? (
                <>
                    <header className="app-header"><h1>🧗‍♂️ Climbing Points</h1></header>
                    <main><StartForm onSessionStart={handleSessionStart} /></main>
                </>
            ) : (
                <SessionProvider userName={sessionData.userName} discipline={sessionData.discipline} gym={sessionData.gym}>
                    <div className="app-container">
                        <main className="main-content">
                            <Routes>
                                <Route path="/" element={<Logbook userName={sessionData.userName} />} />
                                <Route path="/profile" element={<Profile userName={sessionData.userName} />} />
                                <Route path="/add-climb" element={<AddClimb />} />
                            </Routes>
                        </main>
                        <BottomNav onSessionEnd={handleSessionEnd} />
                    </div>
                </SessionProvider>
            )}
        </div>
    );
}

export default App;