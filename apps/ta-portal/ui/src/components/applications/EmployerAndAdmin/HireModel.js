// src/components/applications/EmployerAndAdmin/HireModal.js
'use client';

import React, { useState } from 'react';
import { XIcon } from '@/assets/icons';

export default function HireModal({ application, onClose, onConfirm, isProcessing }) {
  const [employeeId, setEmployeeId] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^\d+$/.test(employeeId.trim())) {
      newErrors.employeeId = 'Employee ID must be a number';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Comment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const employeeIdNumber = parseInt(employeeId.trim(), 10);
    onConfirm(employeeIdNumber, comment.trim());
  };

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    setEmployeeId(value);
    if (errors.employeeId) {
      setErrors(prev => ({ ...prev, employeeId: '' }));
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setComment(value);
    if (errors.comment) {
      setErrors(prev => ({ ...prev, comment: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Hire Candidate
              </h3>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={onClose}
                disabled={isProcessing}
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Candidate Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">
                {application.candidateFName} {application.candidateLName}
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{application.candidateEmail}</p>
                <p>
                  {application.jobPosition.courseCode}-{String(application.jobPosition.sectionNumber).padStart(2, '0')}: {application.jobPosition.course?.name}
                </p>
                <p>Semester: {application.jobPosition.semesterCode}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Employee ID Input */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium leading-6 text-gray-900">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={employeeId}
                    onChange={handleEmployeeIdChange}
                    placeholder="Enter numeric employee ID"
                    maxLength={7}
                    className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.employeeId
                        ? 'ring-red-300 focus:ring-red-500'
                        : 'ring-gray-300 focus:ring-orange-600'
                    }`}
                    disabled={isProcessing}
                  />
                  {errors.employeeId && (
                    <p className="mt-2 text-sm text-red-600">{errors.employeeId}</p>
                  )}
                </div>
              </div>

             {/* Comment Input */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium leading-6 text-gray-900">
                  Hiring Comment <span className="text-red-500">*</span>
                </label>
                <div className="mt-2">
                  <textarea
                    id="comment"
                    name="comment"
                    rows={4}
                    value={comment}
                    onChange={handleCommentChange}
                    placeholder="Provide details on why the candidate is being hired"
                    className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.comment
                        ? 'ring-red-300 focus:ring-red-500'
                        : 'ring-gray-300 focus:ring-orange-600'
                    }`}
                    disabled={isProcessing}
                  />
                  {errors.comment && (
                    <p className="mt-2 text-sm text-red-600">{errors.comment}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                    isProcessing
                      ? 'bg-orange-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500'
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Hire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}