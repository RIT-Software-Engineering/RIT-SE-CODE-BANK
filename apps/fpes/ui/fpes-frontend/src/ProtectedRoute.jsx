import { Navigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export default function ProtectedRoute({ isAuthenticated, children}) {

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}