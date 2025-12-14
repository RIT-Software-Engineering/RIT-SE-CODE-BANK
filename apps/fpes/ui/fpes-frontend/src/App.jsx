import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import theme from './theme/MuiTheme'; 
import { ThemeProvider } from '@mui/material/styles';

import { BrowserRouter, Routes, Route, Link, Navigate  } from 'react-router-dom';
import ProtectedRoute from "./ProtectedRoute.jsx";
import LoginPage from './pages/login/LoginPage.jsx';
import ServicesPage from './pages/services/ServicesPage.jsx';
import GrantsPage from './pages/grants/grantsPage.jsx';
import DepartmentsPage from './pages/departments/DepartmentsPage.jsx';
import CourseSectionsPage from './pages/course_sections/CourseSectionsPage.jsx';
import StudentSupportPage from './pages/student_support/StudentSupportPage.jsx';
import CoursesPage from './pages/courses/CoursePage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import Header from './pages/Header.jsx';
import HighlightsFormPage from './pages/highlights_form/HighlightsFormPage.jsx';
import HomePage from "./pages/home/HomePage";
import HighlightsPage from './pages/highlights_page/HighlightsPage.jsx';
import SupervisedFacultyTable from './pages/supervisor/SupervisedFacultyTable.jsx';
import SupervisingPage from './pages/supervisor/SupervisingPage.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState(new Set([]));
  const [facultyId, setFacultyId] = useState(-1);
  const pages = [
    {
        name : "Departments",
        route : "/departments",
        roles_with_access : new Set(["Admin"])
    },
    {
        name : "Users",
        route : "/users",
        roles_with_access : new Set(["Admin"])
    },
    {
        name : "Courses",
        route : "/courses",
        roles_with_access : new Set(["Admin"])
    },
    {
      name: "Profile",
      route: "/profile",
      roles_with_access : new Set(["Admin", "Faculty", "Supervisor"])
    },
    {
      name : "Home",
      route : "/home",
      roles_with_access : new Set(["Faculty", "Supervisor", "Admin"])
    },
    {
      name : "Highlights",
      route : "/highlights",
      roles_with_access : new Set(["Faculty", "Supervisor"])
    },
    {
      name : "Supervising",
      route : "/supervising",
      roles_with_access : new Set(["Supervisor", "Admin"])
    },
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
 
  const isLoginPage = location.pathname === '/login';
  const shouldShowHeader = !isLoginPage && isAuthenticated;
return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {shouldShowHeader && (
          <Header 
            pages={pages} 
            adminView={roles.intersection(new Set(["Admin"])).size > 0} 
            isAuthenticated={isAuthenticated} 
            onLogout={() => {
              setIsAuthenticated(false);
              setRoles(new Set([]));
              setFacultyId(-1);
            }}
            roles={roles}
            profileRoute="/profile"

          />
        )}
              
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
          <Route path="/home" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HomePage /> </ProtectedRoute>} />
          <Route path="/login" element={<LoginPage setRoles={setRoles} setIsAuthenticated={setIsAuthenticated} updateFacultyId={updateFacultyId} />} />
          {roles.intersection(new Set(["Admin"])).size > 0? adminRoutes : null}
          <Route path="/course_sections" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <CourseSectionsPage/> </ProtectedRoute>} />
          <Route path="/student_support" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <StudentSupportPage/> </ProtectedRoute> } />
          <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <ProfilePage facultyId={facultyId} /> </ProtectedRoute> } />
          <Route path="/highlights" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HighlightsPage facultyId={facultyId}/> </ProtectedRoute> } />
          <Route path="/highlights_form" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HighlightsFormPage facultyId={facultyId}/> </ProtectedRoute> } />
          <Route path="/supervising" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <SupervisingPage facultyId={facultyId} roles={roles}/> </ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <UsersPage/> </ProtectedRoute> } />
        </Routes>
      </BrowserRouter>
  </ThemeProvider>
)
}

export default App
