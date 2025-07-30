// components/timecard/ActionButton.js
export default function ActionButtons({buttonClasses, handleClear, handleSave}) {
  return (
    <div className="mt-8 flex justify-center space-x-4">
      <button
        onClick={handleSave}
        className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-gray`}
      >
        Save
      </button>
      <button
        onClick={handleClear}
        className={`${buttonClasses} bg-gray-300 text-gray-800 hover:bg-gray-400`}
      >
        Clear
      </button>
    </div>
  );
}
