import { getPendingJobPositions } from "@/services/db-apis";
import { useEffect, useState } from "react";
import PositionsCard from "../PositionsCard";

export default function PendingPositions() {
  const [positions, setPositions] = useState([]);


  useEffect(() => {
    async function fetchPositions() {
      const allPositions = await getPendingJobPositions();
      setPositions(allPositions);
    }
    fetchPositions();
    console.log("Positions are "+ positions)
  }, []);

    return (
    <div>
        {positions.map((position) => (
          // Elipse is in ApplicationCard, possibly make it into its own component to reuse
            <PositionsCard key={position.id} position={position}/>
        ))}
    </div>)
}
