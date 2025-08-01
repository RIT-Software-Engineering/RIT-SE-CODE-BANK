import ProtectedRoute from "../utils/ProtectedRoute";

//edit "coach" to "scoopervisor" later
export default function CoachLayout({ children }) {
  return (
    // add admin to required role
    <ProtectedRoute requiredRole="coach"> 
      {children}
    </ProtectedRoute>
  );
}