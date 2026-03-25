import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

//edited "scoopdinator" 
export default function scoopdinatorLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator"]}>
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}