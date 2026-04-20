import ProtectedRoute from "../utils/ProtectedRoute";

export default function scooployeeLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scooployee"]}>
        {children}
    </ProtectedRoute>
  );
}