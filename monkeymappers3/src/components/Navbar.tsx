import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-black bg-gradient border-bottom border-secondary border-opacity-25 py-3 mb-4 shadow-sm">
            <div className="container">
                <Link className="navbar-brand fw-bold text-warning d-flex align-items-center gap-2 fs-4" to="/">
                    <span className="fs-3">🍌</span>
                    <span>Monkey Mappers <span className="text-white-50 fs-6">v3</span></span>
                </Link>
                <div className="navbar-nav ms-auto d-flex flex-row gap-2">
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/"
                    >
                        Map Stats
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/changelogs"
                    >
                        Changelogs
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/participants"
                    >
                        Participants
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/items"
                    >
                        Map Items
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/locations"
                    >
                        Map locations
                    </NavLink>
                    <NavLink
                        className={({ isActive }) => `nav-link px-3 py-2 rounded-pill fw-medium ${isActive ? 'bg-warning text-dark fw-bold' : 'text-light'}`}
                        to="/admin"
                    >
                        Admin Panel
                    </NavLink>
                </div>
            </div>
        </nav>
    );
};