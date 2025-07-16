// src/components/profile/ResumeManager.js

import React, { useState } from 'react';
import {
  uploadNewCandidateResume,
  updatePrimaryResume,
  deleteResume,
  updateResumeName,
} from '@/services/db-apis';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * A component to manage a candidate's resumes (list, upload, rename, delete).
 * @param {object} props - The component props.
 * @param {Array} props.resumes - The list of resume objects.
 * @param {string} props.candidateUID - The UID of the candidate.
 * @param {function} props.onProfileRefresh - Callback to refresh the profile data.
 */
export default function ResumeManager({ resumes, candidateUID, onProfileRefresh }) {
  const { showNotification } = useNotification();

  // State for uploading a new resume
  const [newResumeName, setNewResumeName] = useState('');
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for editing an existing resume's name
  const [editingResumeId, setEditingResumeId] = useState(null);
  const [editingResumeName, setEditingResumeName] = useState('');

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // --- All handler functions are moved here ---

  const handleStartEditing = (resume) => {
    setEditingResumeId(resume.id);
    setEditingResumeName(resume.name);
  };

  const handleCancelEditing = () => {
    setEditingResumeId(null);
    setEditingResumeName('');
  };

  const handleSaveName = async () => {
    if (!editingResumeName.trim()) {
      showNotification('Resume name cannot be empty.', 'error');
      return;
    }
    try {
      await updateResumeName(editingResumeId, editingResumeName.trim());
      showNotification('Resume renamed successfully.', 'success');
      onProfileRefresh();
      handleCancelEditing();
    } catch (err) {
      console.error('Failed to rename resume:', err);
      showNotification(err.message || 'Failed to rename resume.', 'error');
    }
  };

  const handleSetPrimary = async (resumeId) => {
    try {
      await updatePrimaryResume(candidateUID, resumeId);
      onProfileRefresh();
      showNotification('Primary resume updated successfully.', 'success');
    } catch (err) {
      console.error('Failed to set primary resume:', err);
      showNotification(err.message || 'Failed to set primary resume.', 'error');
    }
  };

  const handleDelete = async (resumeId) => {
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await deleteResume(resumeId);
        onProfileRefresh();
        showNotification('Resume deleted successfully.', 'success');
      } catch (err) {
        console.error('Failed to delete resume:', err);
        showNotification(err.message || 'Failed to delete resume.', 'error');
      }
    }
  };

  const handleAddNewResume = async (e) => {
    e.preventDefault();
    if (!newResumeName || !newResumeFile) {
      showNotification('Please provide a resume name and file.', 'error');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('candidateUID', candidateUID);
    formData.append('name', newResumeName);
    formData.append('resumeFile', newResumeFile);

    try {
      await uploadNewCandidateResume(formData);
      setNewResumeName('');
      setNewResumeFile(null);
      e.target.reset();
      onProfileRefresh();
      showNotification('Resume uploaded successfully.', 'success');
    } catch (err) {
      console.error('Failed to upload resume:', err);
      showNotification(err.message || 'An error occurred. Failed to upload resume.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">My Resumes</h3>
      
      {/* List of existing resumes */}
      <div className="space-y-3 mb-6">
        {resumes.length > 0 ? (
          resumes.map((resume) => (
            <div key={resume.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
              {editingResumeId === resume.id ? (
                <>
                  <input
                    type="text" value={editingResumeName} onChange={(e) => setEditingResumeName(e.target.value)}
                    className="flex-grow rounded-md border-gray-300 shadow-sm p-2 mr-3" autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button onClick={handleSaveName} className="text-sm font-medium text-green-600 hover:text-green-800">Save</button>
                    <button onClick={handleCancelEditing} className="text-sm font-medium text-rit-dark-gray hover:text-gray-800">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <a href={`${backendURL}${resume.resumeURL}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                      {resume.name}
                    </a>
                    {resume.isPrimary && <span className="ml-3 text-xs font-bold text-white bg-rit-orange py-1 px-2 rounded-full">Primary</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleStartEditing(resume)} className="text-sm font-medium text-blue-600 hover:text-rit-dark-gray">Rename</button>
                    <button onClick={() => handleSetPrimary(resume.id)} disabled={resume.isPrimary} className="text-sm font-medium text-blue-600 hover:text-rit-dark-gray disabled:text-gray-400 disabled:cursor-not-allowed">Set Primary</button>
                    <button onClick={() => handleDelete(resume.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">No resumes uploaded yet.</p>
        )}
      </div>

      {/* Form to add a new resume */}
      <form onSubmit={handleAddNewResume} className="space-y-4">
        <h4 className="font-semibold text-gray-700">Upload New Resume</h4>
        <div>
          <label htmlFor="resumeName" className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
          <input type="text" id="resumeName" value={newResumeName} onChange={(e) => setNewResumeName(e.target.value)} className="block w-full rounded-md border-gray-300 shadow-sm p-2" placeholder="e.g., Software Engineering Resume" />
        </div>
        <div>
          <label htmlFor="resumeFile" className="block text-sm font-medium text-gray-700 mb-1">Resume File (PDF only)</label>
          <input type="file" id="resumeFile" onChange={(e) => setNewResumeFile(e.target.files[0])} accept=".pdf" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rit-orange file:text-white hover:file:bg-orange-600" />
        </div>
        <button type="submit" disabled={isUploading} className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white font-semibold rounded-md hover:bg-gray-700 disabled:bg-gray-400">
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>
    </div>
  );
}