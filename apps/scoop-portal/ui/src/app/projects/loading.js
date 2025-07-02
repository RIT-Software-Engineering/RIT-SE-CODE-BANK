import Skeleton from "../_components/Skeleton";

/**
 * This is the loading component for the projects page.
 *
 * @description This component is used to display a loading state while the data for all projects is being fetched.
 * @returns {JSX.Element}
 */
function ProjectsLoading() {
    return (
        <div>
            <Skeleton className="w-[10ch] h-[2em]" />
            <main>
                <Skeleton className="w-[11ch] h-[1.5em]" />
            </main>
        </div>
    );
}

export default ProjectsLoading;
