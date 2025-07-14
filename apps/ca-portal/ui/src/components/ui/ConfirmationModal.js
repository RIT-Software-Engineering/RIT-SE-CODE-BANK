'use client';

/**
 * A reusable confirmation dialog component.
 * @param {boolean} isOpen - Whether the modal is visible.
 * @param {function} onClose - Function to call when the modal is closed or cancelled.
 * @param {function} onConfirm - Function to call when the confirm button is clicked.
 * @param {string} title - The title to display in the modal header.
 * @param {React.ReactNode} children - The content/message to display in the modal body.
 * @param {boolean} isConfirming - Optional flag to show a loading state on the confirm button.
 */
export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, children, isConfirming = false }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="text-gray-600 mb-6">
          {children}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}