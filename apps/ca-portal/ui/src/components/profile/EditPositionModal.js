import { useState, useEffect } from "react";
import DisplayField from "../ui/DisplayField";
import { modifyPosition } from "@/services/db-apis";
import ScheduleEditor from "./form-components/ScheduleEditor";

  export const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // Creates a date object and returns it in YYYY-MM-DD format
    return new Date(dateString).toISOString().split("T")[0];
  };

export default function EditPositionModal({ job, onClose, onSave }) {
  const [formData, setFormData] = useState(job);

  useEffect(() => {
    setFormData(job);
  }, [job]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    let processedValue = value; // Start with the original value

    // If the input is a number, process it
    if (type === "number") {
      // If the input is empty, keep it as an empty string for now.
      // Otherwise, convert it to an integer.
      processedValue = value === "" ? "" : parseInt(value, 10);
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Solution: Pass both the ID and the full formData object
      console.log("Form data being sent: ",formData)
      const updatedJob = await modifyPosition(formData.id, formData);
      console.log("Position updated successfully!");
      console.log(updatedJob)
      onSave(updatedJob);
      // closeModal(); // or other success action
    } catch (error) {
      console.error("Failed to modify position:", error);
    }
    onClose();
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Edit Job Position</h2>
        <form onSubmit={handleSubmit}>
          <DisplayField label={"Position ID"} value={job.id} />
          <div className="mb-4">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="locationType"
              className="block text-sm font-medium text-gray-700"
            >
              Location Type
            </label>
            <select
              id="locationType"
              name="locationType"
              value={formData.locationType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={"REMOTE"}>Remote</option>
              <option value={"HYBRID"}>Hybrid</option>
              <option value={"INPERSON"}>In-Person</option>
            </select>
          </div>
          {/* Add more fields as needed for other editable properties */}
          <div>
            <label
              htmlFor="maxCAs"
              className="block text-sm font-medium text-gray-700"
            >
              MaxCA's
            </label>
            <input
              type="number"
              id="maxCAs"
              name="maxCAs"
              value={formData.maxCAs}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formatDateForInput(formData.startDate) || ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formatDateForInput(formData.endDate) || ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <ScheduleEditor initialSchedules={formData.jobSchedules || []} onSchedulesChange={setFormData} />
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
