export default function AlertModal({setShowAlert,buttonClasses,alertMessage}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <p className="text-lg mb-4">{alertMessage}</p>
        <button
          onClick={() => setShowAlert(false)}
          className={`${buttonClasses} bg-rit-orange text-white hover:bg-rit-dark-gray`}
        >
          OK
        </button>
      </div>
    </div>
  );
}
