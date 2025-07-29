import ProtectedRoute from "../utils/ProtectedRoute";

//edit "admin" to "scoopdinator" later
export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}