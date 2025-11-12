import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage.jsx';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsPage from './pages/grants/GrantsPage.jsx';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';
import { FormControl, FormLabel, InputLabel, MenuItem, Select } from '@mui/material';
import StudentSupportPage from './pages/student_support/StudentSupportPage.jsx';
import CoursesPage from './pages/courses/CoursePage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx';
import Header from './pages/Header.jsx';
import HighlightsFormPage from './pages/highlights_form/HighlightsFormPage.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("faculty")

  const pages = [
        {
        name : "login",
        route : "/login",
        adminOnly : false
    },
    {
        name : "Serivces",
        route : "/services",
        adminOnly : false
    },
    {
        name : "Grants",
        route : "/grants",
        adminOnly : false
    },
    {
        name : "Course Sections",
        route : "/course_sections",
        adminOnly : false,
    },
    {
        name : "Student Support",
        route : "/student_support",
        adminOnly : false
    },
    {
        name : "Departments",
        route : "/departments",
        adminOnly : true
    },
    {
        name : "Courses",
        route : "/courses",
        adminOnly : true
    },
    {
      name: "Profile",
      route: "/profile",
      adminOnly: false
    },
    {
      name : "Highlights",
      route : "/highlights_form",
      adminOnly : false
    }
  ]

  const adminRoutes = (
    <>
      <Route path='/departments' element={<DepartmentsPage/>}/>
      <Route path='/courses' element={<CoursesPage/>}/>
    </>
  )

  return (
    <BrowserRouter>
      <Header 
        pages={pages} 
        adminView={role === "admin"} 
        setRole={setRole}
        profileRoute="/profile"
      />
        
      <h1>FPES Portal</h1>
      
      <Routes>
        <Route path="/login" element={<LoginPage setRole={setRole} setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/services" element={<ServicesPage/>} />
        <Route path="/grants" element={<GrantsPage/>} />
        {role === 'admin' ? adminRoutes : null}
        <Route path="/course_sections" element={<CourseSectionsPage/>} />
        <Route path="/student_support" element={<StudentSupportPage/>} />
        <Route path="/profile" element={<ProfilePage/>} />
        <Route path="/highlights_form" element={<HighlightsFormPage/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
