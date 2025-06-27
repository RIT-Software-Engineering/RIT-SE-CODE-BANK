export default function ProjectDetailsLayout({ children }) {
    return (
        <div>
            <p>The page for a specific project will have a different layout than the main Projects page.</p>
            {children}
        </div>
    );
}