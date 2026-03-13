import ProtectedRoute from "../utils/ProtectedRoute";
import { Box } from "@mui/material";

//editd to "scoopervisor"
export default function scoopervisorLayout({ children }) {
  return (
    // add admin to required role?
    <ProtectedRoute requiredRole="scoopervisor"> 
      <Box sx={{ m:3, px:4}}>
        {children}
      </Box>
    </ProtectedRoute>
  );
}