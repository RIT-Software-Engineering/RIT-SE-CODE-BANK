import React from "react";
import { useNavigate } from "react-router-dom";

type Project = {
    id: string;
    name: string;
    description: string;
};

const projects: Project[] = [
    {id: "1", name: "SWEN-262", description: "E-Store semester project for SWEN-261"},
    {id: "2", name: "SWEN-444", description: "UI/UX project for SWEN-444"}
  ]

const PeerDashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleProjectClick = (project: Project) => {
        navigate(`/projects/${project.id}`);
    };

    return (
        <div style={{ padding: "2rem" }} className="prose">
            <h1>Projects</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
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
                        onKeyPress={e => {
                            if (e.key === "Enter" || e.key === " ") {
                                handleProjectClick(project);
                            }
                        }}
                    >
                        <h2 style={{ margin: "0 0 0.5rem 0" }}>{project.name}</h2>
                        <p style={{ margin: 0 }}>{project.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeerDashboard;