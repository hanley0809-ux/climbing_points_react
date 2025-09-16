import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSession } from '../contexts/SessionContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

const gradeColors = {
  "V0": "#4A90E2", "V1": "#4A90E2", "V2": "#50E3C2", "V3": "#50E3C2",
  "V4": "#7ED321", "V5": "#7ED321", "V6": "#F5A623", "V7": "#F5A623",
  "V8": "#D0021B", "V9": "#D0021B",
};

function Logbook({ userName }) {
    const [pyramidData, setPyramidData] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);
    const [stats, setStats] = useState({ hardest_send: "N/A" });
    const { currentSessionClimbs, finishSession } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pyramidRes, sessionsRes, statsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/grade_pyramid/${userName}`),
                    fetch(`${API_BASE_URL}/api/sessions/${userName}`),
                    fetch(`${API_BASE_URL}/api/stats/${userName}`),
                ]);
                const pyramidJson = await pyramidRes.json();
                const sessionsJson = await sessionsRes.json();
                const statsJson = await statsRes.json();
                
                const gradeOrder = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10"];
                const formattedData = gradeOrder.map(grade => ({
                    grade,
                    count: pyramidJson[grade] || 0,
                })).filter(item => item.count > 0);

                setPyramidData(formattedData);
                setRecentSessions(sessionsJson.slice(0, 3)); // Show latest 3
                setStats(statsJson);
            } catch (error) {
                console.error("Failed to fetch logbook data:", error);
            }
        };
        fetchData();
    }, [userName]);

    return (
        <div className="page-container">
            <div className="card">
                <h3 className="card-subtitle">Hardest Send</h3>
                <p className="hardest-grade">{stats.hardest_send}</p>
            </div>
            
            {currentSessionClimbs.length > 0 && (
                <div className="card current-session-card">
                    <h3>Current Session ({currentSessionClimbs.length} climbs)</h3>
                    <ul className="current-climbs-list">
                        {currentSessionClimbs.map(c => <li key={c.id}>{c.grade} ({c.ascentType})</li>)}
                    </ul>
                </div>
            )}

            <div className="card">
                <h2>Grade Pyramid</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={pyramidData} layout="vertical" margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#333'}} contentStyle={{backgroundColor: '#222', border: 'none'}} />
                        <Bar dataKey="count" barSize={20}>
                            {pyramidData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={gradeColors[entry.grade] || '#8884d8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="card">
                <h2>Recent Sessions</h2>
                <div className="sessions-grid">
                    {recentSessions.map(session => (
                        <div key={session.session_name} className="session-card">
                            <h4>{new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                            <p>{session.climbs.length} climbs</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Logbook;