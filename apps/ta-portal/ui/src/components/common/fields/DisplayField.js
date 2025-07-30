export default function DisplayField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <p className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 shadow-sm p-2 text-gray-600">
        {value || 'None'}
      </p>
    </div>
  );
}
