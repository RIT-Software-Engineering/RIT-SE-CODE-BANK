import ProtectedRoute from "../utils/ProtectedRoute";

export default function dashboardLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator", "scoopervisor", "scooployee", "advisor", "applicant"]}>
        {children}
    </ProtectedRoute>
  );
}