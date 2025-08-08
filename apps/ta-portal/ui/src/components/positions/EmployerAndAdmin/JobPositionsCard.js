import DeleteButton from "../../common/buttons/DeleteButton";
import EditButton from "../../common/buttons/EditButton";
import EditPositionModal from "./EditPositionModal";
import { useEffect, useState } from "react";
import { formatTime } from "@/utils/applicationUtils";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

export default function JobPositionsCard({ profileData }) {
  // "EMPLOYER" or "ADMIN" job positions
  const [jobPositions, setJobPositions] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Use useEffect to set the initial jobs from props
useEffect(() => {
    const allJobs = profileData?.employer?.jobPostions || [];

    // Filter the array to only include positions with the status 'OPEN'
    const openJobs = allJobs.filter(job => job.jobPositionStatus === 'OPEN');

    setJobPositions(openJobs);
    console.log("Current Faculty:", profileData?.uid);

  }, [profileData]); // This runs when profileData changes

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleSaveJob = (savedJob) => {
    // Check if the job already exists in our list
    const jobExists = jobPositions.some((job) => job.id === savedJob.id);

    if (jobExists) {
      // If it exists, update it (this is your existing logic)
      setJobPositions((currentJobs) =>
        currentJobs.map((job) => (job.id === savedJob.id ? savedJob : job))
      );
    } else {
      // If it's a new job, add it to the end of the list
      setJobPositions((currentJobs) => [...currentJobs, savedJob]);
    }
  };

  const handleDelete = (job) => {
    deleteJobPosition(job);
  };

  return (
    <>
      <section className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold mb-4">Posted Job Positions</h3>
            <button
              onClick={() => handleOpenModal({})} // Open modal with empty job for new position
            >
              <AddOutlinedIcon
                fontSize="large"
                className="hover:cursor-pointer"
              />
            </button>
          </div>
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
                          {day.dayOfWeek} <br />
                          {formatTime(day.startTime)} -{" "}
                          {formatTime(day.endTime)}
                          <br />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <EditButton handleOpenModal={() => handleOpenModal(job)} />
                    <DeleteButton handleDelete={() => handleDelete(job)} />
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
          EmployerUID={profileData?.uid}
        />
      )}
    </>
  );
}
