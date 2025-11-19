import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter, Routes, Route, Link, Navigate  } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute.jsx";
import LoginPage from './pages/login/LoginPage.jsx';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsPage from './pages/grants/GrantsPage.jsx';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';
import { FormControl, FormLabel, InputLabel, MenuItem, Select } from '@mui/material';
import StudentSupportPage from './pages/student_support/StudentSupportPage.jsx';
import CoursesPage from './pages/courses/CoursePage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import Header from './pages/Header.jsx';
import HighlightsFormPage from './pages/highlights_form/HighlightsFormPage.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("faculty")
  const [facultyId, setFacultyId] = useState(-1);
  const pages = [
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
        name : "users",
        route : "/users",
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
       <Route path="/users" element={<UsersPage />} />
    </>
  )

  function updateFacultyId(id) {
    setFacultyId(id !== undefined ? id : -1);
  } 

  return (
    <BrowserRouter>
      <Header 
        pages={pages} 
        adminView={role === "admin"} 
        setRole={setRole}
        isAuthenticated={isAuthenticated} 
        onLogout={() => {
          setIsAuthenticated(false);
          setRole(null);
          setFacultyId(-1);
        }}
        profileRoute="/profile"
      />
        
      <h1> FPES Portal</h1>

      {!isAuthenticated && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>

          <Link to="/login">
            <button style={{ mt: 2, backgroundColor: "#1976d2", color: "white",}}  >
              Login
            </button>
          </Link>

          <button style={{ mt: 2, backgroundColor: "#555", color: "white", }} >
              Register
          </button>
          
        </div>
      )}
            
              
      <Routes>
        <Route path="/login" element={<LoginPage setRole={setRole} setIsAuthenticated={setIsAuthenticated} updateFacultyId={updateFacultyId} />} />
        <Route path="/services" element={ <ProtectedRoute isAuthenticated={isAuthenticated}> <ServicesPage /> </ProtectedRoute>} />
        <Route path="/grants" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <GrantsPage /> </ProtectedRoute>} />
        {role === 'admin' ? adminRoutes : null}
        <Route path="/course_sections" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <CourseSectionsPage/> </ProtectedRoute>} />
        <Route path="/student_support" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <StudentSupportPage/> </ProtectedRoute> } />
        <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <ProfilePage/> </ProtectedRoute> } />
        <Route path="/highlights_form" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HighlightsFormPage facultyId={facultyId}/> </ProtectedRoute> } />
        <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <UsersPage/> </ProtectedRoute> } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
