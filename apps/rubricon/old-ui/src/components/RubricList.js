import { Link } from "react-router-dom";
import "../styles/components/RubricList.css";
import { useEffect, useState } from "react";

function RubricListItem({ data, setData, index }) {
    // This component will represent a single rubric item in the list.
    // It could be expanded to include more functionality or styling.
    return (
        <div className="list-item">
            <h3>{data.title}</h3>
            <p>{data.description}</p>
            <Link to={"/rubrics/" + data.id}>View Details</Link>
        </div>
    );
}

export default function RubricList() {
    // This component will list all the rubrics available to the signed-in user.
    // In a real application, this would likely fetch data from an API or database.
    const [rubrics, setRubrics] = useState([]);

    function setData(index, newData) {
        // This function updates the rubric data at the specified index.
        // It could be used to update a rubric's details after editing.
        const updatedRubrics = [...rubrics];
        updatedRubrics[index] = newData;
        setRubrics(updatedRubrics);
    }

    useEffect(() => {
        // Simulating fetching rubrics from an API or database
        const fetchRubrics = async () => {
            try {
                const response = await fetch("http://localhost:5000/rubrics");
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setRubrics(data);
            } catch (error) {
                console.error("Failed to fetch rubrics:", error);
            }
        };

        fetchRubrics();
    }, []);

    return (
        <div className="list-container">
            <div className="list-header">
                <h1>Rubric List</h1>
                <p>This is where you can view and manage your rubrics.</p>
            </div>
            <>
                {rubrics.map((rubric, index) => (
                    <RubricListItem key={index} data={rubric} setData={setData} index={index} />
                ))}
                {/* Placeholder for a Rubric component */}
            </>
        </div>
    );
}