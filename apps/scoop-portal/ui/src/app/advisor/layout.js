import ProtectedRoute from "../utils/ProtectedRoute";

export default function scoopervisorLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["advisor"]}> 
        {children}
    </ProtectedRoute>
  );
}