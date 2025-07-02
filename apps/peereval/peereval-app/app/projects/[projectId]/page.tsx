import ClientProjectView from "./ClientProjectView";

interface ProjectViewProps {
    params: {
        projectId: string
    }
}

const ProjectView: React.FC<ProjectViewProps> = ({ params }) =>
    <ClientProjectView projectId={params.projectId} />

export default ProjectView;