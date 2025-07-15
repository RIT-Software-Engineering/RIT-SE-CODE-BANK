import { Schedule } from "@mui/icons-material";
import DeleteIcon from "../icons/DeleteIcon";
import EditIcon from "../icons/EditIcon";
import EditPositionModal from "./EditPositionModal";
import { useEffect, useState } from "react";
import { formatDateForInput } from "./EditPositionModal";

export default function JobPositionsCard({ profileData }) {
  // "EMPLOYER" or "ADMIN" job positions
  const [jobPositions, setJobPositions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // ✅ 2. Use useEffect to set the initial jobs from props
  useEffect(() => {
    const jobs = profileData?.employer?.jobPostions || [];
    setJobPositions(jobs);

    // const schedule =
  }, [profileData]); // This runs when profileData changes

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleSaveJob = (updatedJob) => {
    setJobPositions((currentJobs) =>
      currentJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    );
  };

  const handleDelete = (job) => {
    deleteJobPosition(job);
  };

  function formatTimeFromISO(isoString) {
    if (!isoString) return "N/A";

    const date = new Date(isoString);

    const options = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true, // Use AM/PM
    };

    // 'en-US' can be replaced or omitted to use the browser's default locale
    return date.toLocaleTimeString("en-US", options);
  }

  console.log(FormData  );

  return (
    <>
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
                  className="border-b border-gray-200 pb-4 last:border-b-0 flex flex-row justify-between"
                >
                  <div className="">
                    <div className="font-semibold text-gray-800">{job.id}</div>
                    <div className="text-md text-gray-600">
                      {job.course?.courseCode} -{" "}
                      {job.course?.name || "Unnamed Course"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {job.location} ({job.locationType}) –{" "}
                      {job.jobPositionStatus}
                    </div>
                    <div>
                      {job.jobSchedules?.map((day) => (
                        <span key={day.id} className="mr-3">
                          {day.dayOfWeek} <br/>
                          {formatTimeFromISO(day.startTime)} - {formatTimeFromISO(day.endTime)}
                          <br/>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <EditIcon handleOpenModal={() => handleOpenModal(job)} />
                    <DeleteIcon handleDelete={() => handleDelete(job)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      {isModalOpen && (
        <EditPositionModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSave={handleSaveJob}
        />
      )}
    </>
  );
}
