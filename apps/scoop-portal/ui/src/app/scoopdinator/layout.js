import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

//edit "admin" to "scoopdinator" later
export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}