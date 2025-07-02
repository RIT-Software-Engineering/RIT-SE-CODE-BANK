'use client';

import { useForm } from 'react-hook-form';
import { applyForJobPosition } from '../services/api'; // Adjust path as needed

export default function ApplicationForm({ user, position, onClose, onApplySuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      major: user?.student?.major || '',
      year: user?.student?.year || '',
      resumeURL: user?.student?.resumeURL || '',
    },
  });

  const onSubmit = async (formData) => {
    try {
      const applicationDetails = {
        studentUID: user.uid,
        jobPositionId: position.id,
        jobPositionApplicationFormData: JSON.stringify(formData),
      };

      const newApplication = await applyForJobPosition(applicationDetails);
      
      onApplySuccess(newApplication);
      onClose();

    } catch (err) {
      console.error("Submission failed:", err);
      alert(err.message || 'An unknown error occurred during submission.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Apply for {position.course.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" {...register("name", { required: "Full name is required" })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" {...register("email", { required: "Email is required" })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Major</label>
            <input type="text" {...register("major", { required: "Major is required" })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            {errors.major && <p className="text-red-500 text-sm mt-1">{errors.major.message}</p>}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input type="number" {...register("year", { required: "Year is required" })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
            {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Resume URL</label>
            <input type="url" {...register("resumeURL")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-5 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-rit-orange text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 disabled:bg-gray-400">
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

