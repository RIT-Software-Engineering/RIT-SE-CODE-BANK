import ProtectedRoute from "../utils/ProtectedRoute";

//edited "scoopdinator" 
export default function scoopdinatorLayout({ children }) {
  return (
    <ProtectedRoute requiredRole="scoopdinator">
      {children}
    </ProtectedRoute>
  );
}