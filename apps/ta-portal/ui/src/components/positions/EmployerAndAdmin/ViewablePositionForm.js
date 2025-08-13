"use client";

import { CalendarIcon, ClockIcon, LocationIcon } from '@/assets/icons';
import { formatDate, formatTime } from '@/utils/applicationUtils';

const DetailItem = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="mt-1 text-md text-gray-900">{children || 'N/A'}</div>
  </div>
);

export default function ViewablePositionForm({ position, onClose }) {
  if (!position) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{position.course.name}</h2>
              <p className='text-sm text-gray-500 font-mono'>{position.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700">{position.course.description}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Logistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Location">
                <span className="flex items-center gap-2">
                  <LocationIcon /> {position.location} ({position.locationType})
                </span>
              </DetailItem>
              <DetailItem label="Maximum TAs">{position.maxTAs}</DetailItem>
              <DetailItem label="Start Date">
                <span className="flex items-center gap-2">
                  <CalendarIcon /> {formatDate(position.startDate)}
                </span>
              </DetailItem>
              <DetailItem label="End Date">
                <span className="flex items-center gap-2">
                  <CalendarIcon /> {formatDate(position.endDate)}
                </span>
              </DetailItem>
              <div className="sm:col-span-2">
                <DetailItem label="Weekly Schedule">
                  <div className="flex items-start gap-2">
                    <ClockIcon className="mt-1 flex-shrink-0" />
                    <div>
                      {position.jobSchedules.map((slot, i) => (
                        <span key={i} className='block'>
                          <span className='font-semibold'>{slot.dayOfWeek}:</span>{' '}
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      ))}
                    </div>
                  </div>
                </DetailItem>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailItem label="Graduate Status">{position.graduateStatusRequirement}</DetailItem>
              <DetailItem label="Minimum Grade">{position.gradeRequirement}</DetailItem>
              <DetailItem label="Must Have Taken Course">{position.courseTakenRequirement ? 'Yes' : 'No'}</DetailItem>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-md bg-gray-700 text-white font-semibold hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}