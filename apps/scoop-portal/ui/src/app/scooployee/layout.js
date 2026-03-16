import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

export default function scooployeeLayout({ children }) {
  return (
    <ProtectedRoute requiredRole={["scooployee"]}>
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}