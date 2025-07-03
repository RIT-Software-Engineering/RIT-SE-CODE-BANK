import NavLink from "./NavLink"

export default function Header() {
    return (
        <header className="flex flex-row justify-stretch bg-black text-white">
            <NavLink href="/" className="text-3xl font-bold p-4 hover:text-primary">
                Rubricon
            </NavLink>
            <div className="grow"></div>
            <nav className="flex flex-row justify-stretch gap-2 text-lg font-semibold pr-4">
                <NavLink href="/dashboard" active="text-primary" className="content-center hover:text-primary">
                    Dashboard
                </NavLink>
                <NavLink href="/rubrics" active="text-primary" className="content-center hover:text-primary">
                    Rubrics
                </NavLink>
            </nav>
        </header>
    )
}