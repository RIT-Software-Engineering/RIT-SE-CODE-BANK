import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function DeleteIcon({handleDelete}) {
  return (
    <button
      onClick={handleDelete}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 hover:cursor-pointer transition-colors"
      aria-label="Edit Profile"
    >
      <DeleteOutlineOutlinedIcon />
    </button>
  );
}
