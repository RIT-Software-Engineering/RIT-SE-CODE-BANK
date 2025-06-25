
"use client";
import { getOpenPositions } from "../../services/api";
import React, { useEffect } from "react";

export default function Positions() {
  const [openPositions, setOpenPositions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    async function fetchPositions() {
      try {
        const data = await getOpenPositions(); // Call the service function
        setOpenPositions(data);
      } catch (err) {
        console.error("Failed to fetch open positions:", err);
        setError(err.message); // Store the error message
      } finally {
        setIsLoading(false);
      }
    }

    fetchPositions();
  }, []);

   if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading open positions...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
        Error: {error}
        <p>Please ensure your backend server is running and the database is properly seeded.</p>
      </div>
    );
  }

  if (openPositions.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>No open positions found.</div>;
  }


    return (
        <>
            <div>
                <div className="bg-rit-gray h-auto p-10">
                    <div  className="bg-rit-light-gray h-full rounded-lg p-5  justify-center items-center flex flex-col w-full">
                        <h1 className="text-2xl font-bold mb-5">Positions</h1>
                        {openPositions.map((position, index) => (
                          console.log(position),
                            <div key={index} className="bg-white p-4 mb-4 rounded shadow w-full">
                                {/* Uses course common name eg. Project Management */}
                                <h2 className="text-xl font-semibold">{position.course.name}</h2>
                                {/* Uses course common code eg. SWEN 261 */}
                                <p className="text-gray-700">{position.courseId}</p>
                                {/*  start and end times */}
                                <div className="mt-2">
                                {position.course.schedules.map((slot, i) => (
                                    <p key={i} className="text-gray-700">
                                    <span className="font-medium">{slot.dayOfWeek}:</span> {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                ))}
                                </div>
                                {/* You can add more details here if needed */}
                                <p className="text-gray-600">Location: {position.course.location}</p>
                                <p className="text-gray-500">{position.course.description}</p>
                                {/* Add a button to apply for the position */}
                                <button className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600">Apply Now</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        
        </>
    )
}