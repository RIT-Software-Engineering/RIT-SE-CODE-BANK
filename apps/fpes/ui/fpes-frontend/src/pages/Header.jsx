import { AppBar, Box, Button, FormControl, InputLabel, MenuItem, Select, Toolbar } from '@mui/material'
import react from 'react'
import { Link } from 'react-router-dom'

export default function Header({pages, adminView, setRole}){
    

    return (
        <AppBar position='absolute'>
            <Toolbar>
                <Box sx={{flexGrow:1, display:"flex"}}>
                {pages.map((page, index) => (
                    adminView || page.adminOnly === false ? (<Button key={index} component={Link} to={page.route} color="inherit" >{page.name}</Button>) : null
                ))}
                </Box>
                <FormControl sx={{backgroundColor:"white", borderRadius:"5%"}} variant='filled'>
                    <InputLabel id="role_view_label">View</InputLabel>
                    <Select labelId="role_view_label" label="View" defaultValue={"faculty"} onChange={(e) => setRole(e.target.value)}>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="faculty">Faculty</MenuItem>
                    </Select>
                </FormControl>
            </Toolbar>
            
        </AppBar>
    )
}