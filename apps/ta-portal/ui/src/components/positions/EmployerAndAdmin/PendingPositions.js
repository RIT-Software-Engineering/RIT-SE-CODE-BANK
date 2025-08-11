import { getJobPositionsByStatus } from "@/services/db-apis";
import { useEffect, useState } from "react";
import { useNotification } from "@/contexts/NotificationContext";
import PositionsCard from "../PositionsCard";
import EditableCommentForm from "@/components/comments/EditableCommentForm";
import { modifyPosition } from "@/services/db-apis";

export default function PendingPositions() {
  const [positions, setPositions] = useState([]);
  const [modalState, setModalState] = useState(false);
  const { showNotification } = useNotification();
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useEffect(() => {
    async function fetchPositions() {
      const allPositions = await getJobPositionsByStatus("PENDING_APPROVAL");
      setPositions(allPositions);
    }
    fetchPositions();
    console.log("Positions are " + positions);
  }, []);

  const handleConfirmUpdate = async (comment) => {
  // Check if a position was selected
  if (!selectedPosition) return;

  setIsProcessingUpdate(true);
  try {
    const updatedPositionData = {
      ...selectedPosition,
      jobPositionStatus: modalState.status, // Set the new status 
    };

    const updatedPosition = await modifyPosition(
      selectedPosition.id,
      updatedPositionData
    );

    setPositions((prevPositions) =>
      prevPositions.filter((p) => p.id !== updatedPosition.id)
    );

    showNotification(
      `Position status successfully updated to "${modalState.status?.replaceAll(
        "_",
        " "
      )}".`,
      "success"
    );
  } catch (error) {
    console.error("Failed to update status:", error);
    showNotification(`Error: ${error.message}`, "error");
  } finally {
    setIsProcessingUpdate(false);
    handleCloseUpdateModal();
  }
};

  const handleOpenUpdateModal = (position, status, title) => {
    setSelectedPosition(position); // <-- Add this line

    setModalState({ isOpen: true, status, title });
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: "" });
  };

  return (
    <div>
      <div>
        {positions.map((position) => (
          // Elipse is in ApplicationCard, possibly make it into its own component to reuse
          <PositionsCard
            key={position.id}
            position={position}
            handleOpenUpdateModal={handleOpenUpdateModal}
          />
        ))}
      </div>
      <EditableCommentForm
        isOpen={modalState.isOpen}
        onClose={handleCloseUpdateModal}
        onConfirm={handleConfirmUpdate}
        title={modalState.title}
        isProcessing={isProcessingUpdate}
      />
    </div>
  );
}
