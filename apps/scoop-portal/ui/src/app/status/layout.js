import ProtectedRoute from "@utils/ProtectedRoute";

export default function statusLayout({children}) {
    return (
        <ProtectedRoute requiredRoles={["prospect","applicant"]}>
            {children}
        </ProtectedRoute>
    )
}