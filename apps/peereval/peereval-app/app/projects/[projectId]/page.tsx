'use client';

import { useUserContext } from "@/context/UserContext";
import ClientProjectView from "./ClientProjectView";
import ClientOverseerProjectView from "./ClientOverseerProjectView";

interface ProjectViewProps {
    params: {
        projectId: string
    }
}

const ProjectView: React.FC<ProjectViewProps> = ({ params }) => {

    const {userId, setUserId} = useUserContext();

    return ( userId == "1" ?
        <ClientProjectView projectId={params.projectId} /> :
        <ClientOverseerProjectView projectId={params.projectId} />
    )

}

export default ProjectView;