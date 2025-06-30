"use client";
import SearchBar from "@/components/SearchBar";
import { searchOpenPositions } from "../../services/api";
import React, { useEffect } from "react";
import PositionsCard from "@/components/PositionsCard";

export default function Positions() {
  const [openPositions, setOpenPositions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Get open Positions - Original functionality preserved
  useEffect(() => {
    // Handles fetching open positions when the component mounts
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
  }, []);

  // Search for open positions when search form is submitted
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchOpenPositions(searchTerm);
      setOpenPositions(data);
    } catch (err) {
      console.error("Failed to fetch open positions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render content based on loading state, error state, and if positions can be found
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Positions...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-lg font-semibold text-red-700">
            An Error Occurred
          </p>
          <p className="text-gray-600 mt-2">
            Could not fetch positions. Please ensure the server is running and
            try again later.
          </p>
        </div>
      );
    }

    if (openPositions.length === 0) {
      return (
        <div className="text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">
            No Open Positions Found
          </p>
          <p className="text-gray-600 mt-2">
            Try adjusting your search term or check back later.
          </p>
        </div>
      );
    }
    // If we have open positions, render them
    return openPositions.map((position, index) => (
      <PositionsCard key={index} position={position} index={index} />
    ));
  };

  return (
    // Styled Page Layout
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Open Positions
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Find your next opportunity as a Course Assistant.
            </p>
          </div>

          <div id="positions-container" className="w-full max-w-4xl mx-auto">
            <div className="mb-8">
              <SearchBar onSearch={handleSearch} onChange={setSearchTerm} />
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
