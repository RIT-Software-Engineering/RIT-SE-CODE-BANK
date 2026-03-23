import { AppBar, Box, Button, FormControl, InputLabel, MenuItem, Select, Toolbar } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'

export default function Header({ pages, isAuthenticated, onLogout, roles }) {
    
    const profilePage = pages.find(page => page.name === "Profile");
    const navigate = useNavigate()
    const handleLogout = () => {
            onLogout();
            navigate('/login');
        };
    return (
        <AppBar position='absolute' sx={{ backgroundColor: '#FF7700'}}>
            <Toolbar>
                <Box sx={{flexGrow:1, display:"flex"}}>
                    {isAuthenticated && pages.map((page, index) => (
                        page.name !== "Profile" && roles.intersection(page.roles_with_access).size > 0
                            ? (
                                <Button 
                                    key={index} 
                                    component={Link} 
                                    to={page.route} 
                                    color="inherit"
                                >
                                    {page.name}
                                </Button>
                            ) 
                            : null
                    ))}
                </Box>


                {isAuthenticated && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        
                        {profilePage && (
                            <Button component={Link} to={profilePage.route} color="inherit">
                                {profilePage.name}
                            </Button>
                        )}
                        
                        <Button 
                            color="inherit"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Box>
                )}

            </Toolbar>
        </AppBar>
    );
}