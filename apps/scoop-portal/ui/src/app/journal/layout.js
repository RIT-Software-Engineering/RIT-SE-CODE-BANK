import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

export default function journalLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator", "scoopervisor", "scooployee", "advisor"]}>
        {children}
    </ProtectedRoute>
  );
}