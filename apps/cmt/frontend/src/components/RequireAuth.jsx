import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { LogOut, RefreshCw } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { canInstruct, canLearn, canTeach, hasAnyRole, homeForUser } from "../utils/roles.js";
import LoginWrapper from "../utils/LoginWrapper.js";

/**
 * @param {Object} props
 * @param {string[]} [props.roles]
 * @param {import("react").ReactNode} props.children 
 * @returns 
 */
export default function RequireAuth({ children, roles, teachingInstructor = false, teaching = false, learning = false }) {
  const {user, status, refresh, signOut} = useAuth();
  if (status === "loading") {
    return <Container className="py-5"><div role="status" className="d-flex align-items-center gap-2">
      <Spinner animation="border" size="sm" aria-hidden="true" />Checking session...
    </div></Container>;
  }
  if (status === "anonymous") {
    return <LoginWrapper loginMode="" />;
  }
  if (status === "error" || status === "forbidden" || !homeForUser(user)) {
    return <Container className="py-5"><Alert variant={status === "error" ? "danger" : "warning"}>
      <p>{status === "error" ? "Unable to verify your session." : "Your account does not have access to CMT."}</p>
      <div className="d-flex gap-2 flex-wrap">
        {status === "error" && <Button variant="outline-secondary" onClick={refresh}>
          <RefreshCw size={16} className="me-2" />Retry
        </Button>}
        <Button variant="outline-secondary" onClick={signOut}><LogOut size={16} className="me-2" />Log out</Button>
      </div>
    </Alert></Container>;
  }
  if ((teachingInstructor && !canInstruct(user)) || (teaching && !canTeach(user)) || (learning && !canLearn(user)) || (roles?.length && !hasAnyRole(user, roles)))
    return <Navigate to={homeForUser(user)} replace />;
  return children;
}
