import ProtectedRoute from "../utils/ProtectedRoute";

//edited "scoopdinator" 
export default function scoopdinatorLayout({ children }) {
  return (
    <ProtectedRoute requiredRoles={["scoopdinator", "advisor"]}>
        {children}
    </ProtectedRoute>
  );
}