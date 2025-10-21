import { AppBar, Button, Toolbar } from '@mui/material'
import react from 'react'
import { Link } from 'react-router-dom'

export default function Header({adminView}){
    const pages = [
        {
            name : "Serivces",
            route : "/services"
        }
    ]

    return (
        <AppBar position='static'>
            <Toolbar>
                {pages.map((page, index) => (
                    <Button key={index} to={page.route} color="inherit" >{page.name}</Button>
                ))}
                
            </Toolbar>
        </AppBar>
    )
}