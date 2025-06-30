import "../styles/pages/CreatePage.css"

import Header from "../components/Header";
import { RubricEditor } from "../components/Rubric";
import { useNavigate } from "react-router-dom";

export default function CreatePage() {
    const navigate = useNavigate();

    const data = {
            title: "",
            description: "",
            criteria: [
                {
                    name: "Example Criteria",
                    description: "This is just for reference.",
                    points: 10,
                    levels: [
                        {
                            name: "Example Level 1",
                            description: "Full credit.",
                            points: 10,
                        },
                        {
                            name: "Example Level 2",
                            description: "No credit.",
                            points: 0,
                        },
                    ],
                },
            ],
        }

    async function createRubric(newData) {
        try {
            const response = await fetch("http://localhost:5000/rubrics", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newData),
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            navigate("/rubrics");
        } catch (error) {
            console.error("Failed to fetch rubrics:", error);
        }
    }

    // This page will allow users to create a new rubric.
    // It will include a form for entering rubric details.
    return (
        <>
            <Header />
            <div className="create-page">
                <h2>Create Rubric</h2>
                <RubricEditor data={data} onSave={createRubric}/>
            </div>
        </>
    );
}