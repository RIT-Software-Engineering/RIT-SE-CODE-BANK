export default function EditIcon({handleOpenModal}) {
  return (
    <button
      // The onClick handler should be a function reference, not a function call.
      onClick={handleOpenModal}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:cursor-pointer transition-colors"
      aria-label="Edit Profile"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
        />
      </svg>
    </button>
  );
}
