import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

const GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"];
const ASCENT_TYPES = ["Attempt", "Send", "Flash"];

function AddClimb() {
    const navigate = useNavigate();
    const { logClimb } = useSession();
    const [selectedGrade, setSelectedGrade] = useState('V5');
    const [ascentType, setAscentType] = useState('Send');
    const [notes, setNotes] = useState('');

    const handleLogClimb = () => {
        if (!selectedGrade || !ascentType) {
            alert("Please select a grade and ascent type.");
            return;
        }
        logClimb({ grade: selectedGrade, ascentType, notes });
        navigate('/'); // Go back to the logbook after logging a climb
    };

    return (
        <div className="page-container">
            <div className="card add-climb-form">
                <h2>Grade Selector</h2>
                <div className="grade-selector-container">
                    {GRADES.map(grade => (
                        <button 
                            key={grade}
                            onClick={() => setSelectedGrade(grade)} 
                            className={`grade-chip ${selectedGrade === grade ? 'active' : ''}`}
                        >
                            {grade}
                        </button>
                    ))}
                </div>
                
                <div className="ascent-type-buttons">
                    {ASCENT_TYPES.map(type => (
                        <button 
                            key={type}
                            onClick={() => setAscentType(type)} 
                            className={ascentType === type ? 'active' : ''}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <textarea 
                    className="notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional: Add notes, photo or video link"
                />

                <button onClick={handleLogClimb} className="btn-primary">Log Climb</button>
            </div>
        </div>
    );
}

export default AddClimb;