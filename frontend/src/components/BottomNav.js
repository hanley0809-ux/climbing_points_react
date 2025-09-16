import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiBookOpen, FiUser } from 'react-icons/fi'; // Using icons for a cleaner look

function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiBookOpen size={24} />
                <span>Logbook</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiUser size={24} />
                <span>Profile</span>
            </NavLink>
        </nav>
    );
}

export default BottomNav;