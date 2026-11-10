import SelectUserPage from "user-roles/page";
import ProdLogin from "user-login/page";

export default function LoginWrapper() {
  return process.env.NODE_ENV === 'development'
    ? <SelectUserPage />
    : <ProdLogin />;
}