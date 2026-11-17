import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import HomePage from "../pages/Homepage.jsx";
import { homeForUser } from "../utils/roles.js";

export default function RoleHome() {
    const {user} = useAuth();
    const home = homeForUser(user);
    return home && home !== "/" ? <Navigate to={home} replace /> : <HomePage />;
}
