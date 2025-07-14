"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getProjectsByOverseer, getProjectsByPeer } from "@/services/project";
import { Project } from "@/types/project";

const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const [projectsAsPeer, setProjectsAsPeer] = useState<Project[]>([]);
    const [projectsAsOverseer, setProjectsAsOverseer] = useState<Project[]>([]);

    useEffect(() => {
        if (!currentUser) return () => {};

        (async () => {
            // Get user's projects
            setProjectsAsPeer(await getProjectsByPeer(currentUser.id));
            setProjectsAsOverseer(await getProjectsByOverseer(currentUser.id));
        })();
    }, [currentUser]);

    return (
        <div className="px-8 py-10 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Projects</h1>
            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-semibold mb-4">
                        Projects as Peer
                    </h2>
                    {projectsAsPeer.length === 0 ? (
                        <p className="text-gray-500">
                            You are not a peer in any projects.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-6">
                            {projectsAsPeer.map((project) => (
                                <Link
                                    href={`/projects/${project.id}/`}
                                    key={project.id}
                                    className="w-full sm:w-64"
                                >
                                    <div
                                        className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        tabIndex={0}
                                        role="button"
                                    >
                                        <h3 className="text-xl font-semibold mb-2">
                                            {project.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {project.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-4">
                        Projects as Overseer
                    </h2>
                    <div className="flex flex-wrap gap-6">
                        {projectsAsOverseer.map((project) => (
                            <Link
                                href={`/projects/${project.id}/asOverseer`}
                                key={project.id}
                                className="w-full sm:w-64"
                            >
                                <div
                                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    tabIndex={0}
                                    role="button"
                                >
                                    <h3 className="text-xl font-semibold mb-2">
                                        {project.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        {project.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                        <Link
                            href="/projects/create"
                            className="w-full sm:w-64"
                        >
                            <div
                                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-5 shadow-sm hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col items-center justify-center min-h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                tabIndex={0}
                                role="button"
                                aria-label="Create new project"
                            >
                                <span className="text-5xl text-gray-400 mb-2">
                                    +
                                </span>
                                <span className="text-gray-600 font-medium">
                                    Create New Project
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
