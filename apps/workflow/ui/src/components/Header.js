import { NavLink } from "react-router-dom"

export default function Header() {
    return (
        <header className="bg-black text-white">
            <NavLink to="/" className="hover:text-primary">
                <h1>Workflows</h1>
            </NavLink>
            <nav className="active:text-primary ">
                {/* Put NavLinks for the nav bar here. Might also want to use this area for the Login button */}
            </nav>
        </header>
    )
}