'use client';

import { useState, useEffect } from 'react';
import { getComments } from '@/services/db-apis';
import { formatTimestamp } from '@/utils/dateTimeUtils';
import { applicationStatusEnumToString } from '@/constants/applicationStatusConstants';

export default function ViewableCommentForm({ application, jobPosition, userRole, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const data = await getComments('JobPositionApplicationHistory', application.id);
        setComments(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        setError('Could not load comment history.');
      } finally {
        setLoading(false);
      }
    }

    if (application?.id) {
      fetchComments();
    }
  }, [application]);

  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-500">Loading history...</p>;
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (comments.length === 0) {
      return <p className="text-gray-500">No comments found for this application.</p>;
    }
    return (
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              {/* Left side: Status and Author */}
              <div>
                <p className="font-bold text-gray-800">
                  {applicationStatusEnumToString[comment.status]}
                </p>
                {(userRole === 'ADMIN' || userRole === 'EMPLOYER') && (
                  <p className="text-sm text-gray-600 mt-1">
                    By: <span className="font-medium text-gray-700">{comment.author}</span>
                  </p>
                )}
              </div>
              {/* Right side: Timestamp */}
              <p className="text-sm text-gray-500 flex-shrink-0">
                {formatTimestamp(comment.timestamp)}
              </p>
            </div>
            <p className="text-gray-700 italic pt-2 border-t border-gray-200">
              &quot;{comment.comment}&quot;
            </p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Comment History</h2>
            <p className="text-gray-500">{jobPosition.course.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none -mt-1">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}