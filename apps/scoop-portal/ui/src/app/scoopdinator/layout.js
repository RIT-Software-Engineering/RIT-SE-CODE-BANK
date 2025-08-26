import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

//edited "scoopdinator" 
export default function scoopdinatorLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}