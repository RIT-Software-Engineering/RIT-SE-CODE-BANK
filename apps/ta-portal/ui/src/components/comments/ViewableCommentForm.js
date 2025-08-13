'use client';

import { useState, useEffect } from 'react';
import { getComments } from '@/services/db-apis';
import { formatTimestamp } from '@/utils/dateTimeUtils';

export default function ViewableCommentForm({ 
  foreignKey, 
  foreignTableName,
  itemTitle,
  itemSubtitle,
  statusEnumMap,
  userRole, 
  onClose 
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        // Use generic props for the API call
        const data = await getComments(foreignTableName, foreignKey);
        setComments(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
        setError('Could not load comment history.');
      } finally {
        setLoading(false);
      }
    }

    if (foreignKey && foreignTableName) {
      fetchComments();
    }
  }, [foreignKey, foreignTableName]);

  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-500">Loading history...</p>;
    }
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (comments.length === 0) {
      // Generic "no comments" message
      return <p className="text-gray-500">No comments found for this item.</p>;
    }
    return (
      <ul className="space-y-4">
        {comments.map((comment) => (
          <li key={comment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-gray-800">
                  {/* Use the passed-in status map */}
                  {statusEnumMap[comment.status] || comment.status}
                </p>
                {(userRole === 'ADMIN' || userRole === 'EMPLOYER') && (
                  <p className="text-sm text-gray-600 mt-1">
                    By: <span className="font-medium text-gray-700">{comment.author}</span>
                  </p>
                )}
              </div>
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
     <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{itemTitle}</h2>
            <p className="text-gray-500">{itemSubtitle}</p>
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