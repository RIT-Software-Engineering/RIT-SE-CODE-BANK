import "../css/header.css";
import { Menu, AccountCircle } from "@mui/icons-material";

function Header() {
    return (
        <header>
            <div className="icon menu">
                {
                    // HACK: The inline styling for changing it to white might cause
                    // an error to pop up.
                    // Runtime Error
                    // Hydration failed because the server rendered HTML didn't 
                    // match the client. As a result this tree will be regenerated 
                    // on the client. This can happen if a SSR-ed Client Component 
                    // used
                }
                <Menu />
            </div>
            <div className="ui header">
                <h1><a href="/">SCOOP Portal</a></h1>
            </div>
            <div className="icon accountcircle">
                <AccountCircle />
            </div>
        </header>
    );
}

export default Header;
