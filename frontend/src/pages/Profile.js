import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

function Profile({ userName }) {
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/profile/${userName}`);
                const data = await res.json();
                setProfileData(data);
            } catch (error) {
                console.error("Failed to fetch profile data:", error);
            }
        };
        fetchProfile();
    }, [userName]);

    if (!profileData) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="page-container">
            <div className="profile-header">
                <img src="https://i.imgur.com/8Km9tLL.png" alt="Profile Avatar" className="profile-avatar" />
                <h2>{userName}</h2>
            </div>

            <div className="card">
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-value">{profileData.total_sessions}</span>
                        <span className="stat-label">Total Sessions</span>
                    </div>
                     <div className="stat-item">
                        <span className="stat-value">15,200</span>
                        <span className="stat-label">Vertical Meters</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2>Progress Over Time</h2>
                <ResponsiveContainer width="100%" height={200}>
                    {/* Placeholder for progress chart */}
                    <p style={{textAlign: 'center', padding: '2rem'}}>Chart will be displayed here.</p>
                </ResponsiveContainer>
            </div>
            
            <div className="card">
                <h2>Achievements</h2>
                <div className="achievements-grid">
                    {/* Placeholder for achievements */}
                    <div className="achievement-badge locked">?</div>
                    <div className="achievement-badge locked">?</div>
                    <div className="achievement-badge locked">?</div>
                    <div className="achievement-badge locked">?</div>
                </div>
            </div>
        </div>
    );
}

export default Profile;