import ProtectedRoute from "../utils/ProtectedRoute";

//editd to "scoopervisor"
export default function scoopervisorLayout({ children }) {
  return (
    // add admin to required role?
    <ProtectedRoute requiredRole="scoopervisor"> 
      {children}
    </ProtectedRoute>
  );
}