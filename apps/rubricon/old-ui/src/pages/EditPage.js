import "../styles/pages/EditPage.css"

import Header from "../components/Header";
import { RubricEditor } from "../components/Rubric";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditPage() {
    const rubricId = useParams().id;
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Simulating fetching rubric data from an API or database
        const fetchRubric = async () => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            try {
                const response = await fetch("http://localhost:5000/rubrics/" + rubricId);
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const fetchedData = await response.json();
                setData(fetchedData);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to fetch rubric:", error);
            }
        };

        fetchRubric();
    }, [rubricId]);

    async function updateRubric(newData) {
        try {
            newData.id = rubricId;
            const response = await fetch("http://localhost:5000/rubrics/" + newData.id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newData),
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            navigate("/rubrics/" + newData.id);
        } catch (error) {
            console.error("Failed to fetch rubrics:", error);
        }
    }

    // This page will allow users to create a new rubric.
    // It will include a form for entering rubric details.
    return (
        <>
            <Header />
            <div className="edit-page">
                <h1>Edit Rubric</h1>
                <>
                    {
                        isLoading ? (
                            <p>Loading...</p>
                        ) : (
                            <RubricEditor data={data} onSave={updateRubric} />
                        )
                    }
                </>
            </div>
        </>
    );
}