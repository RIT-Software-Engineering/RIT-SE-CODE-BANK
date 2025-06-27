"use client";
import { useRouter } from "next/navigation";
export default function SelectionCard({ text, icon, link }) {
  const Router = useRouter();
  const handleRedirect = () => {
    Router.push(link);
  };
return (
    <button
        onClick={handleRedirect}
        className="bg-white min-h-44 rounded-xl p-6 m-8 flex flex-col items-center justify-center shadow-lg hover:bg-gray-100 hover:scale-105 transition duration-200 ease-in-out hover:shadow-2xl cursor-pointer"
    >
        {icon && <span className="mb-3 text-4xl text-indigo-600">{icon}</span>}
        <span className="text-xl font-semibold text-gray-900">{text}</span>
    </button>
);
}
