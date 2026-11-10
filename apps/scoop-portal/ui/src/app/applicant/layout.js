import ProtectedRoute from "../utils/ProtectedRoute";

export default function applicantLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["applicant"]}> 
        {children}
    </ProtectedRoute>
  );
}