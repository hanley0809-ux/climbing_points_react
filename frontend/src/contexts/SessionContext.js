import React, { createContext, useState, useContext } from 'react';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children, userName, discipline, gym }) => {
    const [currentSessionClimbs, setCurrentSessionClimbs] = useState([]);
    const [isSaving, setIsSaving] = useState(false); // ADDED: Loading state for saving
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
    
    // MODIFIED: Function now accepts a custom name and a success callback
    const finishSession = async (customSessionName, onSuccessCallback) => {
        if (currentSessionClimbs.length === 0) {
            setCurrentSessionClimbs([]);
            if (onSuccessCallback) onSuccessCallback();
            return;
        }

        setIsSaving(true); // Set loading to true

        // Use custom name if provided, otherwise generate a default
        const defaultSessionName = discipline === "Bouldering" ? `${gym} - ${discipline}` : discipline;
        const finalSessionName = customSessionName || defaultSessionName;

        const payload = {
            userName: userName,
            sessionName: finalSessionName,
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
            alert("Session saved successfully! 🎉");
            if (onSuccessCallback) onSuccessCallback(); // Call success callback
        } catch (error) {
            console.error("Error finishing session:", error);
            alert(`Could not save session: ${error.message}.`);
        } finally {
            setIsSaving(false); // Always set loading to false when done
        }
    };

    // MODIFIED: Expose isSaving in the context value
    const value = { currentSessionClimbs, logClimb, deleteClimb, finishSession, isSaving };
    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};