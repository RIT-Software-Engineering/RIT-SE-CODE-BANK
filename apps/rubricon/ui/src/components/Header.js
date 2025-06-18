import "../styles/components/Header.css";

import { NavLink } from "react-router-dom"

export default function Header() {
    return (
        <header className="App-header">
            <NavLink to="/" className="router-link App-nav-heading">
                <h1>Rubricon Prototype</h1>
            </NavLink>
            <nav className="App-nav">
                <NavLink to="/dashboard" className="router-link App-nav-item">Dashboard</NavLink>
                <NavLink to="/rubrics" className="router-link App-nav-item">Rubrics</NavLink>
                <NavLink to="/profile" className="router-link App-nav-item">Profile</NavLink>
            </nav>
        </header>
    )
}