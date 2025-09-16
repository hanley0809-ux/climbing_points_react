import React, { createContext, useState, useContext } from 'react';

const SessionContext = createContext();
export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children, userName, discipline, gym }) => {
    const [currentSessionClimbs, setCurrentSessionClimbs] = useState([]);
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001';

    const logClimb = (climbData) => {
        const newClimb = {
            id: Date.now(),
            ...climbData,
            timestamp: new Date().toISOString(),
            discipline: discipline,
            gym: discipline === "Bouldering" ? gym : "",
        };
        setCurrentSessionClimbs(prevClimbs => [newClimb, ...prevClimbs]);
    };

    const deleteClimb = (climbId) => {
        setCurrentSessionClimbs(prevClimbs => prevClimbs.filter(climb => climb.id !== climbId));
    };

    const finishSession = async () => {
        if (currentSessionClimbs.length === 0) {
            setCurrentSessionClimbs([]);
            return { success: true };
        }
        const sessionName = discipline === "Bouldering" ? `${gym} - ${discipline}` : discipline;
        const payload = {
            userName: userName,
            sessionName: sessionName,
            climbs: currentSessionClimbs.map(climb => ({
                Discipline: climb.discipline,
                Grade: climb.grade,
                Timestamp: climb.timestamp,
                Gym: climb.gym,
                AscentType: climb.ascentType,
                Notes: climb.notes,
            })),
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Failed to save session to the server.');
            }
            setCurrentSessionClimbs([]);
            return { success: true, message: "Session saved successfully! 🎉" };
        } catch (error) {
            console.error("Error finishing session:", error);
            return { success: false, message: `Could not save session: ${error.message}.` };
        }
    };

    const value = { currentSessionClimbs, logClimb, deleteClimb, finishSession };
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};