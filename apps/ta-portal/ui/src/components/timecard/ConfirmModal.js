// components/timecard/ConfirmModal.js
import { buttonClasses } from "@/constants/timecardConstants";
export default function ConfirmModal({ confirmAction, setShowConfirm, alertMessage }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <p className="text-lg mb-4">{alertMessage}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              confirmAction();
              setShowConfirm(false);
            }}
            className={`${buttonClasses} bg-red-600 text-white hover:bg-red-700`}
          >
            Yes
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className={`${buttonClasses} bg-gray-300 text-gray-800 hover:bg-gray-400`}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
