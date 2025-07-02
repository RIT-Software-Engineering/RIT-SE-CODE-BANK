/**
 * This is the layout for the projects page. It wraps around the contents of ProjectsPage.
 * 
 * @param {*} children - The child components to be rendered within this layout.
 * @returns {JSX.Element}
 */
export default function ProjectsLayout({ children }) {
    return (
        <div>{children}</div>
    );
}