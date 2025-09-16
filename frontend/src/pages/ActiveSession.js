import React, { useState, useEffect } from 'react';
import AddClimbModal from '../components/AddClimbModal';

function useTimer(startTime) {
    const [duration, setDuration] = useState("0:00:00");
    useEffect(() => {
        const timer = setInterval(() => {
            const seconds = Math.floor((new Date() - new Date(startTime)) / 1000);
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            setDuration(`${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime]);
    return duration;
}

function ActiveSession({ session, onLogClimb, onEndSession }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const duration = useTimer(session.startTime);
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

    const handleLogClimb = async (climbData) => {
        try {
            await fetch(`${API_BASE_URL}/api/climb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session.id, ...climbData }),
            });
            onLogClimb(climbData); // Update parent state
            setIsModalOpen(false); // Close modal on success
        } catch (error) {
            console.error("Failed to log climb:", error);
        }
    };

    return (
        <div className="page-container">
            <header className="session-header">
                <div>
                    <h2>{session.location}</h2>
                    <p className="timer">{duration}</p>
                </div>
                <button onClick={onEndSession} className="btn-secondary">End Session</button>
            </header>
            
            <div className="activity-feed">
                <h2>Live Session List</h2>
                {session.climbs.length > 0 ? (
                    session.climbs.map((climb, index) => (
                        <div key={index} className="activity-item">
                            <div className="activity-info">
                                <p className="activity-title">{climb.grade} / {climb.ascent_type}</p>
                                {climb.notes && <p className="activity-subtitle">{climb.notes}</p>}
                            </div>
                        </div>
                    ))
                ) : <p className="placeholder-text">No climbs logged yet for this session.</p>}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="btn-primary">+ Add Climb</button>
            
            {isModalOpen && (
                <AddClimbModal onLogClimb={handleLogClimb} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}

export default ActiveSession;