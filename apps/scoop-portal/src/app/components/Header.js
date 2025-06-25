import "../css/header.css";
import { Menu, AccountCircle } from "@mui/icons-material";

function Header() {
    return (
        <header>
            <div className="icon menu">
                {
                    // HACK: The styling for changing it to white might cause
                    // an error to pop up
                }
                <Menu style={{ color: "white" }} />
            </div>
            <div className="ui header">
                <h1>SCOOP Portal</h1>
                    </div>
            <div className="icon accountcircle">
                <AccountCircle style={{ color: "white" }} />
            </div>
        </header>
    );
}

export default Header;
