import "../styles/pages/RubricPage.css";

import Footer from "../components/Footer";
import Header from "../components/Header";
import Rubric from "../components/Rubric";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";


// let data = require('../data/data.json');

export default function RubricPage() {
    const rubricId = useParams().id
    const [data, setData] = useState(null);

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
            } catch (error) {
                console.error("Failed to fetch rubric:", error);
            }
        };

        fetchRubric();
    }, [rubricId]);

    return (
        <>
            <Header />
            <main className="rubric-page">
                <>
                    {
                        !data ? (
                            <p>No data!</p>
                        ) : (
                            <Rubric data={data} />
                        )
                    }
                </>
                <Link to={"/edit/" + rubricId}>Edit</Link>
            </main>
            <Footer />
        </>
    );
}