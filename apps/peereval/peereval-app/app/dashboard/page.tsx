"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { getProjectsByPeer } from "@/services/project";
import { Project } from "@/types/project";

const Dashboard: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        console.log(`currentUser = ${currentUser}`);

        if (!currentUser) return () => {};

        const getPeerProjects = async () => {
            const ps = await getProjectsByPeer(currentUser.id);
            setProjects(ps);
        };

        getPeerProjects();
    }, [currentUser]);

    return (
        <div style={{ padding: "2rem" }} className="prose">
            <h1>Projects</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                {projects.map((project) => (
                    <Link href={`/projects/${project.id}`} key={project.id}>
                        <div
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "8px",
                                padding: "1rem",
                                width: "250px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                cursor: "pointer",
                                transition: "box-shadow 0.2s",
                            }}
                            tabIndex={0}
                            role="button"
                        >
                            <h2 style={{ margin: "0 0 0.5rem 0" }}>
                                {project.name}
                            </h2>
                            <p style={{ margin: 0 }}>{project.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
