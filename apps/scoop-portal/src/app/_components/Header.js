import { Menu, AccountCircle } from "@mui/icons-material";

function Header() {
    return (
        <header className="p-2 w-full flex justify-between items-center bg-[#f76902] text-white">
            <div id="icon-menu">
                {
                    // BUG: Using Menu and AccountCircle may lead to the error below
                    //
                    // Runtime Error
                    // Hydration failed because the server rendered HTML didn't
                    // match the client. As a result this tree will be regenerated
                    // on the client. This can happen if a SSR-ed Client Component
                    // used
                }
                <Menu />
            </div>
            <div id="ui-header">
                <h1 className="font-bold">
                    <a href="/">SCOOP Portal</a>
                </h1>
            </div>
            <div id="icon-accountcircle">
                <AccountCircle />
            </div>
        </header>
    );
}

export default Header;
