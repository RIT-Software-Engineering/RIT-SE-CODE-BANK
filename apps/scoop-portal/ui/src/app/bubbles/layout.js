import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

export default function bubblesLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator", "scoopervisor", "scooployee", "advisor"]}>
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}