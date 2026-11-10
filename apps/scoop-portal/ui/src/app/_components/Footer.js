import { Box, Typography, Grid, Container, useTheme } from "@mui/material";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CopyrightOutlinedIcon from '@mui/icons-material/CopyrightOutlined';
import React from "react";
// import "../../../css/footer.css";
// import { UserContext } from "../../util/functions/UserContext";

/**
 * TODO: Documentation for Footer component
 *
 * @returns {JSX.Element}
 */
function Footer() {  const theme = useTheme();  //   const { user } = useContext(UserContext);
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
        bgcolor: theme.ritColors.black,
        color: theme.ritColors.white,
        width: '100%',
        left: 0,
        bottom: 0,
        py: 4,
        overflowX: 'hidden',
        position: 'sticky',
        zIndex: 30,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              B. Thomas Golisano
              <br />
              College of Computing &
              <br />
              Information Sciences
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Department of Software Engineering
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              Golisano Building 70, Room 1690
              <br />
              134 Lomb Memorial Drive
              <br />
              Rochester, NY 14623-5608
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', bgcolor: theme.ritColors.white, color: theme.ritColors.black }}>
                <EmailOutlinedIcon sx={{ fontSize: '1rem' }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                scoop@se.rit.edu
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: `1px solid ${theme.ritColors.gray_1}`,
            mt: 3,
            pt: 2,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <CopyrightOutlinedIcon sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 400 }}>
            {new Date().getFullYear()} Rochester Institute of Technology. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
// }

export default Footer;
