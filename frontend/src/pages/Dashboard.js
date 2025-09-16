import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';
const gradeColors = {"V0":"#4A90E2","V1":"#4A90E2","V2":"#50E3C2","V3":"#50E3C2","V4":"#7ED321","V5":"#7ED321","V6":"#F5A623"};

function GradePyramid({ data }) {
    const gradeOrder = ["V0","V1","V2","V3","V4","V5","V6","V7","V8","V9","V10"];
    const formattedData = gradeOrder.map(grade => ({
        grade,
        count: data[grade] || 0,
    })).filter(item => item.count > 0);

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={formattedData} layout="vertical" margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} width={40} />
                <Tooltip cursor={{fill: '#f7f7f7'}} contentStyle={{backgroundColor: '#fff', border: '1px solid #eaeaea'}} />
                <Bar dataKey="count" barSize={20}>
                    {formattedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={gradeColors[entry.grade] || '#8884d8'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

function Dashboard({ userName, onStartSession }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/dashboard/${userName}`);
                const jsonData = await response.json();
                setData(jsonData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userName]);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>Could not load data.</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Logbook</h1>
                <p className="greeting">Good evening, {userName}!</p>
            </header>
            
            <div className="kpi-grid">
                <div className="kpi-item">
                    <h3>Hardest (30d)</h3>
                    <p>{data.hardest_send_30_days}</p>
                </div>
                <div className="kpi-item">
                    <h3>Sessions</h3>
                    <p>{data.total_sessions}</p>
                </div>
                <div className="kpi-item">
                    <h3>Project</h3>
                    <p>{data.current_project}</p>
                </div>
            </div>

            <button onClick={() => onStartSession('Brooklyn Boulders')} className="btn-primary">+ Start New Session</button>

            <div className="card">
                <h2>Grade Pyramid</h2>
                <GradePyramid data={data.pyramid_data} />
            </div>

            <div className="activity-feed">
                <h2>Recent Activity</h2>
                {data.recent_sessions.map(session => (
                    <div key={session.id} className="activity-item">
                        <div className="activity-info">
                            <p className="activity-title">{session.location}</p>
                            <p className="activity-subtitle">{new Date(session.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default Dashboard;