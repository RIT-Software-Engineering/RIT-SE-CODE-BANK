import { useState } from 'react'
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
import TeachingEvalPage from './pages/highlights_page/TeachingEvalPage.jsx';
import AdminHighlightsPage from './pages/highlights_page/AdminHighlightsPage.jsx';
import AnnualEvalPage from './pages/highlights_page/AnnualEvalPage.jsx';
import GettingStartedPage from './pages/getting_started/GettingStartedPage.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState(new Set([]));
  const [facultyId, setFacultyId] = useState(-1);
  const pages = [
    {
      name : "Home",
      route : "/home",
      roles_with_access : new Set(["Faculty", "Supervisor", "Admin"])
    },
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
      name : "Highlights & Teaching Evaluations",
      route : "/highlights",
      roles_with_access : new Set(["Faculty", "Supervisor"])
    },
    {
      name : "Supervising",
      route : "/supervising",
      roles_with_access : new Set(["Supervisor", "Admin"])
    },
    {
      name : "All Highlights",
      route : "/admin-highlights",
      roles_with_access : new Set(["Admin"])
    },
    {
      name : "Teaching Evals",
      route : "/teaching-evals",
      roles_with_access : new Set(["Admin", "Supervisor"])
    },
    {
      name: "Profile",
      route: "/profile",
      roles_with_access : new Set(["Admin", "Faculty", "Supervisor"])
    },
    {
      name : "Annual Evaluation",
      route : "/annual-eval",
      roles_with_access : new Set(["Admin", "Supervisor"])
    },
    {
      name : "Getting Started",
      route : "/getting-started",
      roles_with_access : new Set(["Admin", "Faculty", "Supervisor"])
    },
  ]

  const adminRoutes = (
      <>
        <Route path='/departments' element={<ProtectedRoute isAuthenticated={isAuthenticated}><DepartmentsPage/></ProtectedRoute>}/>
        <Route path='/courses' element={<ProtectedRoute isAuthenticated={isAuthenticated}><CoursesPage/></ProtectedRoute>}/>
        <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated}><UsersPage /></ProtectedRoute>} />
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
          <Route path="/home" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HomePage roles={roles} /> </ProtectedRoute>} />
          <Route path="/login" element={<LoginPage setRoles={setRoles} setIsAuthenticated={setIsAuthenticated} updateFacultyId={updateFacultyId} />} />
          {roles.intersection(new Set(["Admin"])).size > 0? adminRoutes : null}
          <Route path="/course_sections" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <CourseSectionsPage/> </ProtectedRoute>} />
          <Route path="/student_support" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <StudentSupportPage/> </ProtectedRoute> } />
          <Route path="/profile" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <ProfilePage facultyId={facultyId} /> </ProtectedRoute> } />
          <Route path="/highlights" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HighlightsPage facultyId={facultyId} isAdmin={roles.has('Admin')}/> </ProtectedRoute> } />
          <Route path="/highlights_form" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <HighlightsFormPage facultyId={facultyId}/> </ProtectedRoute> } />
          <Route path="/supervising" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <SupervisingPage facultyId={facultyId} roles={roles}/> </ProtectedRoute>} />
          <Route path="/admin-highlights" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <AdminHighlightsPage /> </ProtectedRoute>} />
          <Route path="/teaching-evals" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <TeachingEvalPage/> </ProtectedRoute>} />
          {(roles.has('Admin') || roles.has('Supervisor')) && <Route path="/annual-eval" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <AnnualEvalPage facultyId={facultyId} roles={roles} /> </ProtectedRoute>} />}
          <Route path="/getting-started" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <GettingStartedPage roles={roles}/> </ProtectedRoute>} />
          {/* <Route path="/users" element={<ProtectedRoute isAuthenticated={isAuthenticated}> <UsersPage/> </ProtectedRoute> } /> */}
        </Routes>
      </BrowserRouter>
  </ThemeProvider>
)
}

export default App
