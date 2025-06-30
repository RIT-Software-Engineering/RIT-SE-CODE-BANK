"use client";
import { getOpenPositions, searchOpenPositions } from "../../services/api";
import React, { useEffect } from "react";

export default function Positions() {
  const [openPositions, setOpenPositions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");


  // Get open Positions
  useEffect(() => {
    async function fetchPositions() {
      try {
        const data = await searchOpenPositions(searchTerm); // Call the service function
        setOpenPositions(data);
      } catch (err) {
        console.error("Failed to fetch open positions:", err);
        setError(err.message); // Store the error message
      } finally {
        setIsLoading(false);
      }
    }

    fetchPositions();
  }, [searchTerm]); // Reruns whenever searchTerm changes

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        Loading open positions...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        Error: {error}
        <p>
          Please ensure your backend server is running and the database is
          properly seeded.
        </p>
      </div>
    );
  }

  if (openPositions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No open positions found.
      </div>
    );
  }


  // Search for open positions



  return (
    <>
      <div>
        <div className="bg-rit-gray h-auto p-10">
          <div className="bg-rit-light-gray h-full rounded-lg p-5  w-full">
            <h1 className="text-2xl font-bold mb-5 text-center">Positions</h1>
            {/* Container for all positions */}
            <div id="positions-container" className="w-full max-w-4xl mx-auto">
              {/* Search Bar */}
              <div id="positions-search-bar"
                className="relative w-3/5 mb-5 align-start"
              >
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border-0 bg-white py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 sm:text-sm sm:leading-6"
                    placeholder="Search"
                    onChange={(e) => {setSearchTerm(e.target.value)}}
                    type="search"
                  />
                </div>
              </div>
              {openPositions.map(
                (position, index) => (
                  console.log(position),
                  (
                    <div
                      key={index}
                      className="bg-white p-4 mb-4 rounded shadow w-full"
                    >
                      {/* Uses course common name eg. Project Management */}
                      <h2 className="text-xl font-semibold">
                        {position.course.name}
                      </h2>
                      {/* Uses course common code eg. SWEN 261 */}
                      <p className="text-gray-700">{position.id}</p>
                      {/*  start and end times  */}
                      <div className="mt-2">
                        {position.jobSchedules.map((slot, i) => (
                          <p key={i} className="text-gray-700">
                            <span className="font-medium">
                              {slot.dayOfWeek}:
                            </span>{" "}
                            {new Date(slot.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(slot.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        ))}
                      </div>
                      {/* You can add more details here if needed */}
                      <p className="text-gray-600">
                        Location: {position.location}
                      </p>
                      <p className="text-gray-500">
                        {position.course.description}
                      </p>
                      <button className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600">
                        Apply Now
                      </button>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
