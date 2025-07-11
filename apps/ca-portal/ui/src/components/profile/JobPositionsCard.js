export default function JobPositionsCard({ profileData }) {
  // "EMPLOYER" or "ADMIN" job positions
  const jobPositions = profileData?.employer?.jobPostions || [];
  return (
    <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Posted Job Positions</h3>
        {jobPositions.length === 0 ? (
          <p className="text-gray-500">No posted job positions found.</p>
        ) : (
          <ul className="space-y-3">
            {jobPositions.map((job) => (
              <li
                key={job.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="font-semibold text-gray-800">{job.id}</div>
                <div className="text-md text-gray-600">
                  {job.course?.courseCode} -{" "}
                  {job.course?.name || "Unnamed Course"}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {job.location} ({job.locationType}) – {job.jobPositionStatus}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
