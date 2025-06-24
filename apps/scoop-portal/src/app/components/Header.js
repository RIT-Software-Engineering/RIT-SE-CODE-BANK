import "../css/header.css";
import { Menu, AccountCircle } from "@mui/icons-material";

function Header() {
    return (
        <header>
            <div className="ui container">
                <Menu />
                <h1 className="ui header">
                    SCOOP Portal
                    <div id="subHeader" className="sub header">
                        Department of Software Engineering, RIT
                    </div>
                </h1>
                <AccountCircle />
            </div>
        </header>
    )
}

export default Header;
