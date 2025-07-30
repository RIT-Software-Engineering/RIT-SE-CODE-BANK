import { useState } from "react";
import ReactDOM from "react-dom";
import { createCourse } from "@/services/db-apis"; // Import the API function

export default function CreateCourseModal ({getValues, initialCode, onClose, onCourseCreated }) {
  const [courseCode, setCourseCode] = useState(initialCode);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newCourse = await createCourse({ courseCode, name, description });
      onCourseCreated(newCourse);
      onClose(); 
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // The modal's JSX is  wrapped in a Portal.
  // This renders the modal at the end of `document.body`, outside the main form.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <form onSubmit={handleCreate} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Create New Course</h2>
        
        {/* Course Code (Read-only) */}
        <div>
          <label htmlFor="new-course-code" className="block text-sm font-medium text-gray-700">Course Code</label>
          <input 
            id="new-course-code"
            value={courseCode} 
            readOnly 
            className="mt-1 w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm"
          />
        </div>
        
        {/* Course Name (Required) */}
        <div>
          <label htmlFor="new-course-name" className="block text-sm font-medium text-gray-700">Course Name</label>
          <input 
            id="new-course-name"
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="new-course-description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea 
            id="new-course-description"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows="3"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>,
    document.body // The target DOM node for the portal
  );
};
