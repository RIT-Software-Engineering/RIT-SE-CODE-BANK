"use client";

import { useAuth } from "@/context/UserContext";
import ClientProjectView from "./ClientProjectView";
import ClientOverseerProjectView from "./ClientOverseerProjectView";
import { useEffect, useState, use } from "react";
import { getProjectOverseers } from "@/services/project";

interface ProjectViewProps {
    params: {
        projectId: string;
    };
}

const ProjectView: React.FC<ProjectViewProps> = ({ params }) => {
    const { currentUser, setCurrentUser } = useAuth();
    const [isOverseer, setIsOverseer] = useState<Boolean>(false);
    const [loadingView, setLoadingView] = useState<Boolean>(true);

    const { projectId } = params;

    useEffect(() => {
        const getIfOverseer = async () => {
            // Get the overseers for this project
            const os = await getProjectOverseers(projectId);
            const oIds = os.map((o) => o.id);

            setIsOverseer(oIds.includes(currentUser?.id ?? ""));
            setLoadingView(false);
        };

        getIfOverseer();
    }, [currentUser]);

    if (loadingView) {
        return <p>Loading...</p>;
    }

    console.log(`overseer is ${isOverseer}`);

    return isOverseer ? (
        <ClientOverseerProjectView projectId={projectId} />
    ) : (
        <ClientProjectView projectId={projectId} />
    );
};

export default ProjectView;
