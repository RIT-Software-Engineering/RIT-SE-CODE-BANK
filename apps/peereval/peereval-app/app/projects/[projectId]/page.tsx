"use client";

import { useAuth } from "@/context/UserContext";
import ClientProjectView from "./ClientProjectView";
import ClientOverseerProjectView from "./ClientOverseerProjectView";
import { useEffect, useState } from "react";
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

    useEffect(() => {
        const getIfOverseer = async () => {
            // Get the overseers for this project
            const os = await getProjectOverseers(params.projectId);
            const oIds = os.map((o) => o.id);

            if (oIds.includes(currentUser?.id ?? "")) setIsOverseer(true);

            setLoadingView(false);
        };

        getIfOverseer();
    }, [currentUser]);

    if (loadingView) {
        return <p>Loading...</p>;
    }

    return isOverseer ? (
        <ClientOverseerProjectView projectId={params.projectId} />
    ) : (
        <ClientProjectView projectId={params.projectId} />
    );
};

export default ProjectView;
