import { Button } from "react-bootstrap";
import { CMTDangerAlert } from "../utils/error";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div>
            <CMTDangerAlert error={"403 | You are not authorized to view this page."}></CMTDangerAlert>
            <Button onClick={() => navigate('/')}><div className='flex items-center'><ArrowLeft/>Return To HomePage</div></Button>
        </div>
    )
}