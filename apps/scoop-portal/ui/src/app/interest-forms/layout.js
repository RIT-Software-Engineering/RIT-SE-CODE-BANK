import ProtectedRoute from "../utils/ProtectedRoute";

export default function interestFormsLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator","advisor"]}>
        {children}
    </ProtectedRoute>
  );
}