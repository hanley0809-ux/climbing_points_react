import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi'; // Icon for successful sends

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

function Logbook({ userName }) {
    const [recentClimbs, setRecentClimbs] = useState([]);
    const [todayStats, setTodayStats] = useState({ totalClimbs: 0, hardest: 'N/A', duration: '0h 0m' });

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/sessions/${userName}`);
                const sessions = await response.json();
                
                // For simplicity, we'll just show the last 5 climbs as "Session Activity"
                const allClimbs = sessions.flatMap(s => s.climbs).slice(0, 5);
                setRecentClimbs(allClimbs);

                // Logic to calculate "Today's" stats can be added here
                // This is a placeholder for now
                setTodayStats({ totalClimbs: allClimbs.length, hardest: 'V5', duration: '1h 15m' });

            } catch (error) {
                console.error("Failed to fetch session data:", error);
            }
        };
        fetchSessions();
    }, [userName]);

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Logbook</h1>
            </header>
            
            <div className="card summary-card">
                <div className="date-header">
                    <h3>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                    <p>The Newstone Gym</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-value">{todayStats.totalClimbs}</span>
                        <span className="stat-label">Total Climbs</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{todayStats.hardest}</span>
                        <span className="stat-label">Hardest</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{todayStats.duration}</span>
                        <span className="stat-label">Duration</span>
                    </div>
                </div>
                <Link to="/add-climb" className="btn-primary">+ Log New Session</Link>
            </div>

            <div className="activity-feed">
                <h2>Session Activity</h2>
                {recentClimbs.length > 0 ? (
                    recentClimbs.map((climb, index) => (
                        <div key={index} className="activity-item">
                            <FiCheckCircle className="activity-icon" />
                            <div className="activity-info">
                                <p className="activity-title">{`Route ${index + 1} / ${climb.grade} / ${climb.ascent_type}`}</p>
                                <p className="activity-subtitle">Ascent</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No recent activity.</p>
                )}
            </div>
        </div>
    );
}

export default Logbook;