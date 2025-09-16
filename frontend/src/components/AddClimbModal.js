import React, { useState } from 'react';

const GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8"];
const ASCENT_TYPES = ["Attempt", "Send", "Flash"];

function AddClimbModal({ onLogClimb, onClose }) {
    const [climbingType, setClimbingType] = useState('Boulder');
    const [grade, setGrade] = useState('V3');
    const [ascentType, setAscentType] = useState('Attempt');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onLogClimb({ climbing_type: climbingType, grade, ascent_type: ascentType, notes });
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Add Climb</h2>
                {/* Climbing Type: Boulder | Top Rope | Lead */}
                <div className="segmented-control">
                    <button onClick={() => setClimbingType('Boulder')} className={climbingType === 'Boulder' ? 'active' : ''}>Boulder</button>
                    <button onClick={() => setClimbingType('Top Rope')} className={climbingType === 'Top Rope' ? 'active' : ''}>Top Rope</button>
                    <button onClick={() => setClimbingType('Lead')} className={climbingType === 'Lead' ? 'active' : ''}>Lead</button>
                </div>
                
                {/* Grade Selector */}
                <label>Grade</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="input-field">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                {/* Ascent Type Buttons */}
                <div className="ascent-type-buttons">
                    {ASCENT_TYPES.map(type => (
                        <button key={type} onClick={() => setAscentType(type)} className={ascentType === type ? 'active' : ''}>
                            {type}
                        </button>
                    ))}
                </div>

                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (e.g., beta, conditions)" className="input-field" />

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary">Log Climb</button>
                </div>
            </div>
        </div>
    );
}

export default AddClimbModal;