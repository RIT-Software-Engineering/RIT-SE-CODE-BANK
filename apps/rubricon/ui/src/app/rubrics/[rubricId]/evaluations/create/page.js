"use client";

import RubricEvaluator from "@/components/RubricEvaluator";
import { useState, useEffect } from "react";
import { server_url } from "@/consts";
import { useParams } from "next/navigation";

export default function RubricCreateEvaluationPage() {
    const params = useParams();
    const { rubricId } = params;

    const [data, setData] = useState(null);
    const [rowSelections, setRowSelections] = useState([])

    useEffect(() => {
        const fetchRubric = async () => {
            try {
                const res = await fetch(`${server_url}/rubrics/${rubricId}`, {
                    method: 'GET',
                    headers: { Accept: "application/json" }
                })
                const rubric = await res.json();
                console.log(rubric);
                setData(rubric);
                // setRowSelections([-1] * rubric.row)
            } catch (error) {
                console.error("Failed to fetch rubrics:", error);
            }
        };

        fetchRubric();
    }, [server_url, rubricId]);

  return (
    <form className="flex flex-col items-stretch w-4/5 mx-auto mt-4 gap-4">
      <h1 className="text-4xl text-center">Create Evaluate</h1>

      {/* Title Input */}
      <div className="flex flex-col items-stretch w-auto">
        <label>Title:</label>
        <input type="text" placeholder="Enter a title to help you identify this evaluation" className="border rounded-md"></input>
      </div>

      {/* Evaluatee Input */}
      <div className="flex flex-col items-stretch w-auto">
        <label>Evaluatee:</label>
        <input type="text" className="border rounded-md"></input>
      </div>

      {/* Evalute the Evaluatees performance using the Rubric Evaluator */}
      {data && <RubricEvaluator data={data} />}
    </form>
  );
}
