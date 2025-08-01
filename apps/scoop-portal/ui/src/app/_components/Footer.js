import { AppBar, Box, Container } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
// import "../../../css/footer.css";
// import { UserContext } from "../../util/functions/UserContext";

<<<<<<< HEAD
// TODO: Documentation for Footer component
// TODO: Redo footer
/**
 *
 *
 * @returns {JSX.Element}
 */
=======
>>>>>>> origin/scoop-portal-dev
function Footer() {
    //   const { user } = useContext(UserContext);
    //   const [signedIn, setSignedIn] = useState(false);
    //   useEffect(() => {
    // A user is considered signed in if the user object has a value
    // This is set when the /whoami endpoint gets hit (currently happening in the Dashboard.js).
    // setSignedIn(Object.keys(user).length !== 0);
    //   }, [user]);

    //   if (signedIn) {
    //     return (
    //       <div id="footer">
    //         <div id="bringMeDown" className="ui container stackable grid">
    //           <div className="two column row">
    //             <div className="column">
    //               <h5 id="copyright">
    //                 <i className="ui icon copyright"></i> Rochester Institute of
    //                 Technology, All Rights Reserved
    //               </h5>
    //             </div>
    //             <div id="version" className="column">
    //               <h5>
    //                 <a
    //                   href="https://github.com/RIT-Software-Engineering/SCOOP-Portal"
    //                   target="_blank"
    //                   rel="noreferrer"
    //                 >
    //                   V.1
    //                 </a>
    //               </h5>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   } else {
    return (
        <Box
            sx={{
                bgcolor: "#000",
                color: "#fff",
                height: "fit",
                // maxHeight: "fit",
                width: "100%",
                // position: "fixed",
                left: 0,
                bottom: 0,
                p: 2,

                textAlign: "center",
                boxShadow: 2,
                // position: "relative",

                overflowX: "hidden",
            }}
        >
            <Box
                display="flex"
                alignItems="center"
                gap={2}
                justifyContent="center"
                flexWrap="wrap"
            >
                <h3>
                    B. THOMAS GOLISANO <br />
                    COLLEGE OF COMPUTING & <br />
                    INFORMATION SCIENCES
                </h3>

                <h4>
                    Department of Software Engineering
                    <br />
                    Golisano Building 70, Room 1690
                    <br />
                    134 Lomb Memorial Drive
                    <br />
                    Rochester, NY 14623-5608
                </h4>

                <div>
                    <h4>
                        <i className="ui mail icon"></i> scoop@se.rit.edu
                    </h4>
                </div>
            </Box>
            <h5>
                <i className="ui icon copyright"></i> Rochester Institute of
                Technology, All Rights Reserved
            </h5>
        </Box>
    );
}
// }

export default Footer;
